import { z } from "zod";

export const createMerchantSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    walletAddress: z.string().regex(
        /^0x[a-fA-F0-9]{40}$/,
        "Invalid wallet address"
    ),
});

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
