import { ethers } from "ethers";

import prisma from "../lib/prisma.js";
import {
    getConfirmations,
    getNetwork,
    getTransaction,
    getTransactionReceipt,
} from "./blockchainService.js";

const PAYMENT_GATEWAY_ABI = [
    "event PaymentReceived(bytes32 indexed paymentId,address indexed payer,address indexed merchant,address token,uint256 amount)",
];

export class VerificationError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "VerificationError";
    }
}

export interface VerifyPaymentInput {
    paymentId: string;
    chainId: number;
    txHash: string;
}

export async function verifyPayment(input: VerifyPaymentInput) {
    const payment = await prisma.payment.findUnique({
        where: {
            paymentId: input.paymentId,
        },
    });

    if (!payment) {
        throw new VerificationError(
            "Payment not found",
            404,
        );
    }

    const network = getNetwork(input.chainId);

    if (!network || !network.isActive) {
        throw new VerificationError(
            `Unsupported or inactive network: ${input.chainId}`,
            400,
        );
    }

    const transaction = await getTransaction(
        input.chainId,
        input.txHash,
    );

    if (!transaction) {
        throw new VerificationError(
            "Blockchain transaction not found",
            400,
        );
    }

    const receipt = await getTransactionReceipt(
        input.chainId,
        input.txHash,
    );

    if (!receipt) {
        throw new VerificationError(
            "Transaction receipt not available",
            400,
        );
    }

    if (receipt.status !== 1) {
        throw new VerificationError(
            "Blockchain transaction failed",
            400,
        );
    }

    if (!transaction.to) {
        throw new VerificationError(
            "Transaction has no recipient",
            400,
        );
    }

    if (
        transaction.to.toLowerCase() !==
        network.gatewayAddress.toLowerCase()
    ) {
        throw new VerificationError(
            "Transaction was not sent to the PaymentGateway",
            400,
        );
    }

    const iface = new ethers.Interface(PAYMENT_GATEWAY_ABI);

    let paymentReceived:
        | {
              paymentId: string;
              payer: string;
              merchant: string;
              token: string;
              amount: bigint;
          }
        | undefined;

    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog({
                topics: log.topics as string[],
                data: log.data,
            });

            if (!parsed || parsed.name !== "PaymentReceived") {
                continue;
            }

            paymentReceived = {
                paymentId: parsed.args[0] as string,
                payer: parsed.args[1] as string,
                merchant: parsed.args[2] as string,
                token: parsed.args[3] as string,
                amount: parsed.args[4] as bigint,
            };

            break;
        } catch {
            // Ignore logs belonging to other contracts/events.
        }
    }

    if (!paymentReceived) {
        throw new VerificationError(
            "PaymentReceived event not found in transaction",
            400,
        );
    }

    if (
        paymentReceived.paymentId.toLowerCase() !==
        payment.paymentId.toLowerCase()
    ) {
        throw new VerificationError(
            "Payment ID does not match",
            400,
        );
    }

    if (
        paymentReceived.merchant.toLowerCase() !==
        payment.recipientAddress.toLowerCase()
    ) {
        throw new VerificationError(
            "Merchant address does not match",
            400,
        );
    }

    if (
        paymentReceived.token.toLowerCase() !==
        payment.tokenAddress.toLowerCase()
    ) {
        throw new VerificationError(
            "Token address does not match",
            400,
        );
    }

    if (
        paymentReceived.amount.toString() !==
        payment.amount
    ) {
        throw new VerificationError(
            "Payment amount does not match",
            400,
        );
    }

    const confirmations = await getConfirmations(
        input.chainId,
        input.txHash,
    );

    const isConfirmed =
        confirmations >= network.confirmationRequirement;

    const transactionStatus = isConfirmed
        ? "CONFIRMED"
        : "DETECTED";

    const paymentStatus = isConfirmed
        ? "CONFIRMED"
        : "VERIFYING";

    const transactionRecord = await prisma.transaction.upsert({
        where: {
            chainId_txHash: {
                chainId: BigInt(input.chainId),
                txHash: input.txHash,
            },
        },
        create: {
            paymentId: payment.id,
            txHash: input.txHash,
            chainId: BigInt(input.chainId),
            senderAddress: paymentReceived.payer,
            recipientAddress: paymentReceived.merchant,
            tokenAddress: paymentReceived.token,
            amount: paymentReceived.amount.toString(),
            blockNumber:
                receipt.blockNumber !== null
                    ? BigInt(receipt.blockNumber)
                    : null,
            confirmations,
            status: transactionStatus,
        },
        update: {
            confirmations,
            blockNumber:
                receipt.blockNumber !== null
                    ? BigInt(receipt.blockNumber)
                    : undefined,
            status: transactionStatus,
        },
    });

    await prisma.payment.update({
        where: {
            id: payment.id,
        },
        data: {
            status: paymentStatus,
        },
    });

    return {
        transaction: transactionRecord,
        paymentStatus,
        confirmations,
        requiredConfirmations:
            network.confirmationRequirement,
    };
}