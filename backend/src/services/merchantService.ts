import prisma from "../lib/prisma.js";
import type { CreateMerchantInput } from "../schemas/merchantSchema.js";

export async function createMerchant(input: CreateMerchantInput) {
    // Reuse an existing merchant for the same wallet.
    const existingByWallet = await prisma.merchant.findFirst({
        where: {
            walletAddress: input.walletAddress,
        },
    });

    if (existingByWallet) {
        return existingByWallet;
    }

    // If the default email already exists, reuse that merchant.
    const existingByEmail = await prisma.merchant.findUnique({
        where: {
            email: input.email,
        },
    });

    if (existingByEmail) {
        return existingByEmail;
    }

    return prisma.merchant.create({
        data: {
            name: input.name,
            email: input.email,
            walletAddress: input.walletAddress,
        },
    });
}

export async function getMerchantById(merchantId: string) {
    return prisma.merchant.findUnique({
        where: {
            id: merchantId,
        },
    });
}
