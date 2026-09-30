import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatEther } from "viem";

import Navbar from "../components/layout/Navbar";
import { useWallet } from "../hooks/useWallet";
import { getMerchantPayments, type Payment } from "../lib/api";

function TransactionsPage() {
    const { address } = useWallet();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!address) {
            setPayments([]);
            return;
        }

        let cancelled = false;

        async function loadTransactions() {
            const walletAddress = address;

            if (!walletAddress) {
                return;
            }

            try {
                setLoading(true);
                setError("");

                const storageKey = `multipay_merchant_${walletAddress.toLowerCase()}`;
                const merchantId = localStorage.getItem(storageKey);

                if (!merchantId) {
                    throw new Error("Merchant account not found. Open the Dashboard first.");
                }

                const response = await getMerchantPayments(merchantId);

                if (!cancelled) {
                    setPayments(response.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load transactions");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadTransactions();

        return () => {
            cancelled = true;
        };
    }, [address]);

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Transactions
                        </h1>

                        <p className="mt-2 text-gray-600">
                            View payments and their blockchain transactions.
                        </p>
                    </div>

                    <Link
                        to="/create-payment"
                        className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Create Payment
                    </Link>
                </div>

                {loading && (
                    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
                        <p className="text-gray-600">Loading transactions...</p>
                    </div>
                )}

                {error && (
                    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
                        <p className="font-medium text-red-800">{error}</p>
                    </div>
                )}

                {!loading && !error && payments.length === 0 && (
                    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                        <p className="font-medium text-gray-900">No transactions yet</p>

                        <p className="mt-2 text-sm text-gray-500">
                            Create a payment to see it here.
                        </p>
                    </div>
                )}

                {!loading && !error && payments.length > 0 && (
                    <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Payment ID
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Blockchain TX
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Amount
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Description
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Created
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-5">
                                                <p className="max-w-xs truncate font-mono text-sm text-gray-900">
                                                    {payment.paymentId}
                                                </p>
                                            </td>

                                            <td className="px-6 py-5">
                                                {payment.transactions &&
                                                payment.transactions.length > 0 ? (
                                                    <a
                                                        href={`https://sepolia.etherscan.io/tx/${payment.transactions[0].txHash}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-mono text-sm text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        {payment.transactions[0].txHash.slice(
                                                            0,
                                                            10,
                                                        )}
                                                        ...
                                                        {payment.transactions[0].txHash.slice(-8)}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-400">
                                                        Not detected
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-5">
                                                <p className="font-semibold text-gray-900">
                                                    {formatEther(BigInt(payment.amount))} ETH
                                                </p>
                                            </td>

                                            <td className="px-6 py-5">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        payment.status === "PAID" ||
                                                        payment.status === "CONFIRMED"
                                                            ? "bg-green-100 text-green-700"
                                                            : payment.status === "CANCELLED"
                                                              ? "bg-red-100 text-red-700"
                                                              : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {payment.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 text-sm text-gray-600">
                                                {payment.description || "—"}
                                            </td>

                                            <td className="px-6 py-5 text-sm text-gray-500">
                                                {new Date(payment.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

export default TransactionsPage;
