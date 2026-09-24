// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {PaymentTypes} from "../libraries/PaymentTypes.sol";

/**
 * @title IPaymentGateway
 * @notice Interface for creating, managing, and settling payment requests.
 * @dev
 * Supports settlement using either the native blockchain currency or
 * an ERC-20 token, depending on how the payment is configured.
 *
 * A payment progresses through a lifecycle in which it can be:
 *
 * - Created by a merchant.
 * - Settled by a payer.
 * - Cancelled by the merchant before settlement.
 * - Expired once `block.timestamp` exceeds its expiry timestamp.
 *
 * Implementations are responsible for enforcing authorization,
 * payment-state transitions, token transfers, and settlement logic.
 */
interface IPaymentGateway {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Thrown when a payment amount is zero or otherwise invalid.
     */
    error InvalidAmount();

    /**
     * @notice Thrown when a payment expiration timestamp is invalid.
     */
    error InvalidExpiry();

    /**
     * @notice Thrown when a payment identifier does not correspond
     * to an existing payment.
     */
    error PaymentNotFound();

    /**
     * @notice Thrown when an attempt is made to pay a payment that
     * has already been settled.
     */
    error PaymentAlreadyPaid();

    /**
     * @notice Thrown when an attempt is made to pay a cancelled payment.
     */
    error PaymentAlreadyCancelled();

    /**
     * @notice Thrown when an attempt is made to pay an expired payment.
     */
    error PaymentExpired();

    /**
     * @notice Thrown when the caller is not authorized to perform
     * the requested operation.
     */
    error Unauthorized();

    /**
     * @notice Thrown when the amount supplied for native currency
     * settlement does not exactly match the required payment amount.
     */
    error IncorrectPaymentAmount();

    /**
     * @notice Thrown when the configured or supplied token is invalid
     * or incompatible with the requested payment method.
     */
    error InvalidToken();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitted when a merchant creates a new payment request.
     * @param paymentId Unique identifier of the payment.
     * @param merchant Address of the merchant creating the payment.
     * @param token Address of the token expected for settlement.
     * @param amount Amount required to settle the payment.
     * @param expiresAt Unix timestamp after which the payment expires.
     */
    event PaymentCreated(
        bytes32 indexed paymentId,
        address indexed merchant,
        address indexed token,
        uint256 amount,
        uint256 expiresAt
    );

    /**
     * @notice Emitted when a payment is successfully settled.
     * @param paymentId Unique identifier of the settled payment.
     * @param payer Address that made the payment.
     * @param merchant Address receiving the payment.
     * @param token Asset used to settle the payment.
     * @param amount Amount received by the merchant.
     */
    event PaymentReceived(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        address token,
        uint256 amount
    );

    /**
     * @notice Emitted when a merchant cancels an outstanding payment.
     * @param paymentId Unique identifier of the cancelled payment.
     * @param merchant Address of the merchant that cancelled the payment.
     */
    event PaymentCancelled(bytes32 indexed paymentId, address indexed merchant);

    /*//////////////////////////////////////////////////////////////
                            PAYMENT CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new payment request.
     * @dev
     * The returned payment identifier is used to reference the payment
     * in subsequent settlement and management operations.
     *
     * The implementation should reject zero amounts and invalid
     * expiration timestamps.
     *
     * @param token Address of the token expected for settlement.
     * @param amount Amount that must be paid.
     * @param expiresAt Unix timestamp at which the payment expires.
     *
     * @return paymentId Unique identifier assigned to the payment.
     *
     * @custom:security The implementation should ensure that each
     * payment identifier is unique.
     */
    function createPayment(
        address token,
        uint256 amount,
        uint256 expiresAt
    ) external returns (bytes32 paymentId);

    /*//////////////////////////////////////////////////////////////
                              SETTLEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Settles a payment using the native blockchain currency.
     * @dev
     * The caller must provide exactly the amount specified by the
     * payment request through `msg.value`.
     *
     * The implementation should reject payments that are:
     *
     * - nonexistent;
     * - already paid;
     * - cancelled;
     * - expired; or
     * - configured for an incompatible token.
     *
     * @param paymentId Unique identifier of the payment to settle.
     *
     * @custom:security The implementation must validate `msg.value`
     * against the payment amount before accepting the payment.
     */
    function payNative(bytes32 paymentId) external payable;

    /**
     * @notice Settles a payment using its configured ERC-20 token.
     * @dev
     * The payer is expected to have approved the payment gateway
     * to transfer the required token amount before calling this function.
     *
     * The implementation should verify the payment state and ensure
     * that the expected token amount is successfully transferred.
     *
     * @param paymentId Unique identifier of the payment to settle.
     *
     * @custom:security Implementations should account for ERC-20
     * transfer failures and non-standard token behavior.
     */
    function payToken(bytes32 paymentId) external;

    /*//////////////////////////////////////////////////////////////
                              MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Cancels an outstanding payment request.
     * @dev
     * Only the merchant associated with the payment should be able
     * to cancel it.
     *
     * A cancelled payment must not be subsequently settled.
     *
     * @param paymentId Unique identifier of the payment to cancel.
     */
    function cancelPayment(bytes32 paymentId) external;

    /*//////////////////////////////////////////////////////////////
                                VIEWS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the complete payment information.
     * @param paymentId Unique identifier of the payment.
     *
     * @return payment Payment information associated with the identifier.
     */
    function getPayment(
        bytes32 paymentId
    ) external view returns (PaymentTypes.Payment memory payment);

    /**
     * @notice Determines whether a payment exists.
     * @param paymentId Unique identifier of the payment.
     *
     * @return exists True if the payment exists, otherwise false.
     */
    function paymentExists(bytes32 paymentId) external view returns (bool exists);
}
