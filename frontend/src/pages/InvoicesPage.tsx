import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import { useWallet } from "../hooks/useWallet";
import {
    createInvoice,
    getMerchant,
    getMerchantInvoices,
    type Invoice,
    type Merchant,
} from "../lib/api";

function InvoicesPage() {
    const { address, isConnected } = useWallet();

    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");

    useEffect(() => {
        if (!address) {
            setMerchant(null);
            setInvoices([]);
            return;
        }

        let cancelled = false;

        async function loadInvoices() {
            setLoading(true);
            setError("");

            try {
                const walletAddress = address;

                if (!walletAddress) {
                    return;
                }

                const storageKey = `multipay_merchant_${walletAddress.toLowerCase()}`;
                const merchantId = localStorage.getItem(storageKey);

                if (!merchantId) {
                    throw new Error(
                        "Merchant account not found. Open the dashboard first.",
                    );
                }

                const [merchantResponse, invoicesResponse] = await Promise.all([
                    getMerchant(merchantId),
                    getMerchantInvoices(merchantId),
                ]);

                if (cancelled) return;

                setMerchant(merchantResponse.data);
                setInvoices(invoicesResponse.data);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to load invoices",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadInvoices();

        return () => {
            cancelled = true;
        };
    }, [address]);

    async function handleCreateInvoice(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!merchant) return;

        setCreating(true);
        setError("");
        setSuccess("");

        try {
            const response = await createInvoice({
                merchantId: merchant.id,
                invoiceNumber,
                customerName: customerName || undefined,
                customerEmail: customerEmail || undefined,
                description: description || undefined,
                amount,
                currency: "ETH",
                dueDate: new Date(dueDate).toISOString(),
            });

            setInvoices((current) => [response.data, ...current]);

            setInvoiceNumber("");
            setCustomerName("");
            setCustomerEmail("");
            setDescription("");
            setAmount("");
            setDueDate("");

            setSuccess(
                `Invoice ${response.data.invoiceNumber} created successfully.`,
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create invoice",
            );
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="mx-auto max-w-7xl px-6 py-12">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-indigo-600">
                            Merchant Billing
                        </p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                            Invoices
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Create and manage payment invoices.
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                        ← Dashboard
                    </Link>
                </div>

                {!isConnected && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-800">
                        Connect your wallet to manage invoices.
                    </div>
                )}

                {isConnected && loading && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
                        Loading invoices...
                    </div>
                )}

                {isConnected && error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {isConnected && !loading && merchant && (
                    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
                        <form
                            onSubmit={handleCreateInvoice}
                            className="rounded-xl border border-gray-200 bg-white p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900">
                                Create Invoice
                            </h2>

                            <div className="mt-5 space-y-4">
                                <input
                                    required
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    placeholder="Invoice number"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />

                                <input
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Customer name"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />

                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="Customer email"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />

                                <input
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Amount (ETH)"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />

                                <input
                                    required
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />

                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Description"
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {creating ? "Creating..." : "Create Invoice"}
                                </button>

                                {success && (
                                    <p className="text-sm text-green-700">{success}</p>
                                )}
                            </div>
                        </form>

                        <section className="rounded-xl border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Invoice History
                            </h2>

                            {invoices.length === 0 ? (
                                <p className="mt-6 text-sm text-gray-500">
                                    No invoices created yet.
                                </p>
                            ) : (
                                <div className="mt-5 overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="px-3 py-3">Invoice</th>
                                                <th className="px-3 py-3">Customer</th>
                                                <th className="px-3 py-3">Amount</th>
                                                <th className="px-3 py-3">Due</th>
                                                <th className="px-3 py-3">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {invoices.map((invoice) => (
                                                <tr
                                                    key={invoice.id}
                                                    className="border-b border-gray-100"
                                                >
                                                    <td className="px-3 py-4 font-medium text-gray-900">
                                                        {invoice.invoiceNumber}
                                                    </td>

                                                    <td className="px-3 py-4 text-gray-600">
                                                        {invoice.customerName || "—"}
                                                    </td>

                                                    <td className="px-3 py-4 text-gray-900">
                                                        {invoice.amount} {invoice.currency}
                                                    </td>

                                                    <td className="px-3 py-4 text-gray-600">
                                                        {new Date(
                                                            invoice.dueDate,
                                                        ).toLocaleDateString()}
                                                    </td>

                                                    <td className="px-3 py-4">
                                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

export default InvoicesPage;
