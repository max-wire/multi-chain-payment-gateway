import { Request, Response, NextFunction } from "express";
import {
    createMerchant,
    getMerchantById,
} from "../services/merchantService.js";
import { createMerchantSchema } from "../schemas/merchantSchema.js";

function getParam(value: string | string[] | undefined): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    return value;
}

export async function createMerchantController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const parsed = createMerchantSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid merchant data",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const merchant = await createMerchant(parsed.data);

        res.status(201).json({
            success: true,
            data: merchant,
        });
    } catch (error) {
        next(error);
    }
}

export async function getMerchantController(
    req: Request,
    res: Response,
    next: NextFunction
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

        const merchant = await getMerchantById(merchantId);

        if (!merchant) {
            res.status(404).json({
                success: false,
                message: "Merchant not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: merchant,
        });
    } catch (error) {
        next(error);
    }
}