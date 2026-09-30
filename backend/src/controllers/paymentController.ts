import { Request, Response, NextFunction } from "express";
import { createPayment, getPaymentById, getMerchantPayments } from "../services/paymentService.js";
import { createPaymentSchema } from "../schemas/paymentSchema.js";

function getParam(value: string | string[] | undefined): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    return value;
}

function serializeBigInt<T>(value: T): T {
    return JSON.parse(JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
}

export async function createPaymentController(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = createPaymentSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid payment data",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const payment = await createPayment(parsed.data);

        res.status(201).json({
            success: true,
            data: serializeBigInt(payment),
        });
    } catch (error) {
        next(error);
    }
}

export async function getPaymentController(req: Request, res: Response, next: NextFunction) {
    try {
        const paymentId = getParam(req.params.paymentId);

        if (!paymentId) {
            res.status(400).json({
                success: false,
                message: "Invalid payment ID",
            });
            return;
        }

        const payment = await getPaymentById(paymentId);

        if (!payment) {
            res.status(404).json({
                success: false,
                message: "Payment not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: serializeBigInt(payment),
        });
    } catch (error) {
        next(error);
    }
}

export async function getMerchantPaymentsController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const merchantId = getParam(req.params.merchantId);

        if (!merchantId) {
            res.status(400).json({
                success: false,
                message: "Invalid merchant ID",
            });
            return;
        }

        const payments = await getMerchantPayments(merchantId);

        res.status(200).json({
            success: true,
            data: serializeBigInt(payments),
        });
    } catch (error) {
        next(error);
    }
}
