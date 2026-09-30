import { Request, Response, NextFunction } from "express";

import {
    createInvoice,
    getInvoiceById,
    getMerchantInvoices,
    updateInvoiceStatus,
} from "../services/invoiceService.js";
import {
    createInvoiceSchema,
    updateInvoiceStatusSchema,
} from "../schemas/invoiceSchema.js";

function getParam(value: string | string[] | undefined): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    return value;
}

function serializeBigInt<T>(value: T): T {
    return JSON.parse(
        JSON.stringify(value, (_, v) =>
            typeof v === "bigint" ? v.toString() : v,
        ),
    );
}

export async function createInvoiceController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const parsed = createInvoiceSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid invoice data",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const invoice = await createInvoice(parsed.data);

        res.status(201).json({
            success: true,
            data: serializeBigInt(invoice),
        });
    } catch (error) {
        next(error);
    }
}

export async function getInvoiceController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const invoiceId = getParam(req.params.invoiceId);

        if (!invoiceId) {
            res.status(400).json({
                success: false,
                message: "Invalid invoice ID",
            });
            return;
        }

        const invoice = await getInvoiceById(invoiceId);

        if (!invoice) {
            res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: serializeBigInt(invoice),
        });
    } catch (error) {
        next(error);
    }
}

export async function getMerchantInvoicesController(
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

        const invoices = await getMerchantInvoices(merchantId);

        res.status(200).json({
            success: true,
            data: serializeBigInt(invoices),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateInvoiceStatusController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const invoiceId = getParam(req.params.invoiceId);

        if (!invoiceId) {
            res.status(400).json({
                success: false,
                message: "Invalid invoice ID",
            });
            return;
        }

        const parsed = updateInvoiceStatusSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid invoice status",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const invoice = await updateInvoiceStatus(
            invoiceId,
            parsed.data.status,
        );

        res.status(200).json({
            success: true,
            data: serializeBigInt(invoice),
        });
    } catch (error) {
        next(error);
    }
}
