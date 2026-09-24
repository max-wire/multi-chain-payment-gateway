// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library PaymentTypes {
    enum Status {
        Created,
        Paid,
        Cancelled
    }

    struct Payment {
        bytes32 paymentId;
        address merchant;
        address token;
        uint256 amount;
        uint256 createdAt;
        uint256 expiresAt;
        Status status;
    }
}
