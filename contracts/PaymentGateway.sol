// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IPaymentGateway} from "./interfaces/IPaymentGateway.sol";
import {PaymentTypes} from "./libraries/PaymentTypes.sol";

/**
 * @title PaymentGateway
 * @notice Non-custodial payment gateway for native currency and ERC-20 payments.
 *
 * @dev
 * Payment configuration:
 *
 * - token == address(0) -> native blockchain currency
 * - token != address(0) -> ERC-20 token
 *
 * The gateway never intentionally holds merchant funds.
 * Native currency is sent directly to the merchant and ERC-20 tokens
 * are transferred directly from the payer to the merchant.
 */
contract PaymentGateway is IPaymentGateway {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice All payment requests indexed by their unique identifier.
     */
    mapping(bytes32 => PaymentTypes.Payment) private s_payments;

    /**
     * @notice Monotonically increasing nonce used to generate unique IDs.
     */
    uint256 private s_nonce;

    /*//////////////////////////////////////////////////////////////
                            PAYMENT CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IPaymentGateway
     */
    function createPayment(
        address token,
        uint256 amount,
        uint256 expiresAt
    ) external returns (bytes32 paymentId) {
        if (amount == 0) {
            revert InvalidAmount();
        }

        if (expiresAt <= block.timestamp) {
            revert InvalidExpiry();
        }

        paymentId = keccak256(abi.encode(block.chainid, msg.sender, s_nonce++));

        s_payments[paymentId] = PaymentTypes.Payment({
            paymentId: paymentId,
            merchant: msg.sender,
            token: token,
            amount: amount,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: PaymentTypes.Status.Created
        });

        emit PaymentCreated(paymentId, msg.sender, token, amount, expiresAt);
    }

    /*//////////////////////////////////////////////////////////////
                              SETTLEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IPaymentGateway
     */
    function payNative(bytes32 paymentId) external payable {
        PaymentTypes.Payment storage payment = s_payments[paymentId];

        _validatePaymentForSettlement(payment);

        // Native payment is only valid for native-currency payments.
        if (payment.token != address(0)) {
            revert InvalidToken();
        }

        if (msg.value != payment.amount) {
            revert IncorrectPaymentAmount();
        }

        // Mark paid before the external transfer.
        payment.status = PaymentTypes.Status.Paid;

        // Transfer directly to the merchant.
        (bool success, ) = payable(payment.merchant).call{value: payment.amount}("");

        if (!success) {
            revert("NATIVE_TRANSFER_FAILED");
        }

        emit PaymentReceived(paymentId, msg.sender, payment.merchant, address(0), payment.amount);
    }

    /**
     * @inheritdoc IPaymentGateway
     */
    function payToken(bytes32 paymentId) external {
        PaymentTypes.Payment storage payment = s_payments[paymentId];

        _validatePaymentForSettlement(payment);

        // ERC-20 payment must have a configured token.
        if (payment.token == address(0)) {
            revert InvalidToken();
        }

        IERC20 token = IERC20(payment.token);

        // Mark paid before the external token transfer.
        payment.status = PaymentTypes.Status.Paid;

        // Transfer directly from payer to merchant.
        token.safeTransferFrom(msg.sender, payment.merchant, payment.amount);

        emit PaymentReceived(
            paymentId,
            msg.sender,
            payment.merchant,
            payment.token,
            payment.amount
        );
    }

    /*//////////////////////////////////////////////////////////////
                              MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IPaymentGateway
     */
    function cancelPayment(bytes32 paymentId) external {
        PaymentTypes.Payment storage payment = s_payments[paymentId];

        if (payment.merchant == address(0)) {
            revert PaymentNotFound();
        }

        if (payment.merchant != msg.sender) {
            revert Unauthorized();
        }

        if (payment.status == PaymentTypes.Status.Paid) {
            revert PaymentAlreadyPaid();
        }

        if (payment.status == PaymentTypes.Status.Cancelled) {
            revert PaymentAlreadyCancelled();
        }

        payment.status = PaymentTypes.Status.Cancelled;

        emit PaymentCancelled(paymentId, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                                VIEWS
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IPaymentGateway
     */
    function getPayment(
        bytes32 paymentId
    ) external view returns (PaymentTypes.Payment memory payment) {
        payment = s_payments[paymentId];

        if (payment.merchant == address(0)) {
            revert PaymentNotFound();
        }
    }

    /**
     * @inheritdoc IPaymentGateway
     */
    function paymentExists(bytes32 paymentId) external view returns (bool exists) {
        return s_payments[paymentId].merchant != address(0);
    }

    /*//////////////////////////////////////////////////////////////
                         INTERNAL VALIDATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validates common payment settlement conditions.
     */
    function _validatePaymentForSettlement(PaymentTypes.Payment storage payment) internal view {
        if (payment.merchant == address(0)) {
            revert PaymentNotFound();
        }

        if (payment.status == PaymentTypes.Status.Paid) {
            revert PaymentAlreadyPaid();
        }

        if (payment.status == PaymentTypes.Status.Cancelled) {
            revert PaymentAlreadyCancelled();
        }

        if (block.timestamp > payment.expiresAt) {
            revert PaymentExpired();
        }
    }
}
