import prisma from "../lib/prisma.js";

interface CreateInvoiceInput {
    merchantId: string;
    invoiceNumber: string;
    customerName?: string;
    customerEmail?: string;
    description?: string;
    amount: string;
    currency: string;
    dueDate: Date;
}

export async function createInvoice(input: CreateInvoiceInput) {
    return prisma.invoice.create({
        data: {
            merchantId: input.merchantId,
            invoiceNumber: input.invoiceNumber,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            description: input.description,
            amount: input.amount,
            currency: input.currency,
            dueDate: input.dueDate,
        },
    });
}

export async function getInvoiceById(invoiceId: string) {
    return prisma.invoice.findUnique({
        where: {
            id: invoiceId,
        },
        include: {
            merchant: true,
            payment: true,
        },
    });
}

export async function getMerchantInvoices(merchantId: string) {
    return prisma.invoice.findMany({
        where: {
            merchantId,
        },
        include: {
            payment: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function updateInvoiceStatus(
    invoiceId: string,
    status: "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED",
) {
    return prisma.invoice.update({
        where: {
            id: invoiceId,
        },
        data: {
            status,
        },
    });
}
