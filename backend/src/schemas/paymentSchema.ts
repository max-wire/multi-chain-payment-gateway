import { z } from "zod";

export const createPaymentSchema = z.object({
    merchantId: z.string().uuid(),
    paymentId: z.string().min(1),
    amount: z.string().regex(/^\d+$/, "Amount must be an integer string"),
    tokenAddress: z.string().regex(
        /^0x[a-fA-F0-9]{40}$/,
        "Invalid token address"
    ),
    recipientAddress: z.string().regex(
        /^0x[a-fA-F0-9]{40}$/,
        "Invalid recipient address"
    ),
    description: z.string().max(500).optional(),
    expiresAt: z.coerce.date(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
