import { z } from "zod";

export const createInvoiceSchema = z.object({
    merchantId: z.string().uuid(),
    invoiceNumber: z.string().min(1).max(100),
    customerName: z.string().max(200).optional(),
    customerEmail: z.string().email().optional(),
    description: z.string().max(500).optional(),
    amount: z.string().min(1),
    currency: z.string().min(1).max(20).default("ETH"),
    dueDate: z.coerce.date(),
});

export const updateInvoiceStatusSchema = z.object({
    status: z.enum(["ISSUED", "PAID", "OVERDUE", "CANCELLED"]),
});
