import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { VerificationError, verifyPayment } from "../services/verificationService.js";

const verifyTransactionSchema = z.object({
    paymentId: z.string().min(1),
    chainId: z.number().int().positive(),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
});

export async function verifyTransactionController(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = verifyTransactionSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid transaction verification data",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await verifyPayment(parsed.data);

        res.status(200).json({
            success: true,
            data: {
                ...result,
                transaction: result.transaction
                    ? {
                          ...result.transaction,
                          chainId: result.transaction.chainId.toString(),
                          blockNumber: result.transaction.blockNumber?.toString() ?? null,
                      }
                    : null,
            },
        });
    } catch (error) {
        if (error instanceof VerificationError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
            return;
        }

        next(error);
    }
}
