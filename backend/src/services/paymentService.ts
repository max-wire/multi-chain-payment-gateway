import prisma from "../lib/prisma.js";

interface CreatePaymentInput {
    merchantId: string;
    paymentId: string;
    amount: string;
    tokenAddress: string;
    recipientAddress: string;
    description?: string;
    expiresAt: Date;
}

export async function createPayment(input: CreatePaymentInput) {
    return prisma.payment.create({
        data: {
            merchantId: input.merchantId,
            paymentId: input.paymentId,
            amount: input.amount,
            tokenAddress: input.tokenAddress,
            recipientAddress: input.recipientAddress,
            description: input.description,
            expiresAt: input.expiresAt,
        },
    });
}

export async function getPaymentById(paymentId: string) {
    return prisma.payment.findUnique({
        where: {
            paymentId,
        },
        include: {
            transactions: true,
        },
    });
}

export async function getMerchantPayments(merchantId: string) {
    return prisma.payment.findMany({
        where: {
            merchantId,
        },
        include: {
            transactions: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}