import prisma from "../lib/prisma.js";
import type { CreateMerchantInput } from "../schemas/merchantSchema.js";

export async function createMerchant(input: CreateMerchantInput) {
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
