const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
        },
        ...options,
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(body?.message || "API request failed");
    }

    return body;
}

export interface Merchant {
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentTransaction {
    id: string;
    txHash: string;
    chainId: number | string;
    senderAddress: string;
    recipientAddress: string;
    tokenAddress: string;
    amount: string;
    blockNumber: number | string | null;
    confirmations: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface Payment {
    id: string;
    paymentId: string;
    merchantId: string;
    amount: string;
    tokenAddress: string;
    recipientAddress: string;
    description: string | null;
    expiresAt: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    transactions?: PaymentTransaction[];
}

export async function createMerchant(data: { name: string; email: string; walletAddress: string }) {
    return request<{ success: boolean; data: Merchant }>("/merchants", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getMerchant(merchantId: string) {
    return request<{ success: boolean; data: Merchant }>(`/merchants/${merchantId}`);
}

export async function getMerchantPayments(merchantId: string) {
    return request<{ success: boolean; data: Payment[] }>(`/payments/merchant/${merchantId}`);
}

export async function createPayment(data: {
    merchantId: string;
    paymentId: string;
    amount: string;
    tokenAddress: string;
    recipientAddress: string;
    description?: string;
    expiresAt: string;
}) {
    return request<{ success: boolean; data: Payment }>("/payments", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getPayment(paymentId: string) {
    return request<{ success: boolean; data: Payment }>(`/payments/${paymentId}`);
}

export async function verifyTransaction(data: {
    paymentId: string;
    chainId: number;
    txHash: string;
}) {
    return request("/transactions/verify", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export interface Invoice {
    id: string;
    merchantId: string;
    invoiceNumber: string;
    customerName: string | null;
    customerEmail: string | null;
    description: string | null;
    amount: string;
    currency: string;
    status: "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED";
    dueDate: string;
    paymentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export async function createInvoice(data: {
    merchantId: string;
    invoiceNumber: string;
    customerName?: string;
    customerEmail?: string;
    description?: string;
    amount: string;
    currency?: string;
    dueDate: string;
}) {
    return request<{ success: boolean; data: Invoice }>("/invoices", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getInvoice(invoiceId: string) {
    return request<{ success: boolean; data: Invoice }>(`/invoices/${invoiceId}`);
}

export async function getMerchantInvoices(merchantId: string) {
    return request<{ success: boolean; data: Invoice[] }>(
        `/invoices/merchant/${merchantId}`,
    );
}

export async function updateInvoiceStatus(
    invoiceId: string,
    status: Invoice["status"],
) {
    return request<{ success: boolean; data: Invoice }>(
        `/invoices/${invoiceId}/status`,
        {
            method: "PATCH",
            body: JSON.stringify({ status }),
        },
    );
}
