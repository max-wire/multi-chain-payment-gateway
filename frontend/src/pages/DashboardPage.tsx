import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import { useWallet } from "../hooks/useWallet";
import {
    createMerchant,
    getMerchant,
    getMerchantPayments,
    type Merchant,
    type Payment,
} from "../lib/api";

function DashboardPage() {
    const { address, isConnected } = useWallet();

    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!address) {
            setMerchant(null);
            setPayments([]);
            return;
        }

        let cancelled = false;

        async function loadDashboard() {
            const walletAddress = address;

            if (!walletAddress) {
                return;
            }

            setLoading(true);
            setError("");

            try {
                const storageKey = `multipay_merchant_${walletAddress.toLowerCase()}`;
                const storedMerchantId = localStorage.getItem(storageKey);

                let currentMerchant: Merchant;

                if (storedMerchantId) {
                    const response = await getMerchant(storedMerchantId);
                    currentMerchant = response.data;
                } else {
                    const response = await createMerchant({
                        name: "MultiPay Merchant",
                        email: "merchant@multipay.local",
                        walletAddress,
                    });

                    currentMerchant = response.data;
                    localStorage.setItem(storageKey, currentMerchant.id);
                }

                const paymentsResponse = await getMerchantPayments(currentMerchant.id);

                if (cancelled) {
                    return;
                }

                setMerchant(currentMerchant);
                setPayments(paymentsResponse.data);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                setError(err instanceof Error ? err.message : "Failed to load dashboard");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [address]);

    const totalPayments = payments.length;

    const paidPayments = payments.filter(
        (payment) => payment.status === "PAID" || payment.status === "CONFIRMED",
    ).length;

    const pendingPayments = payments.filter(
        (payment) =>
            payment.status !== "PAID" &&
            payment.status !== "CONFIRMED" &&
            payment.status !== "CANCELLED",
    ).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="mx-auto max-w-7xl px-6 py-12">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-indigo-600">Merchant Dashboard</p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                            Dashboard
                        </h1>

                        <p className="mt-2 text-gray-600">Manage your MultiPay payment requests.</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/invoices"
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Invoices
                        </Link>

                        <Link
                            to="/create-payment"
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Create Payment
                        </Link>
                    </div>
                </div>

                {!isConnected && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-800">
                        Connect your wallet to view your merchant dashboard.
                    </div>
                )}

                {isConnected && loading && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
                        Loading dashboard...
                    </div>
                )}

                {isConnected && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                        {error}
                    </div>
                )}

                {isConnected && !loading && !error && merchant && (
                    <>
                        <div className="mb-8 grid gap-6 md:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 bg-white p-6">
                                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {totalPayments}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-6">
                                <p className="text-sm font-medium text-gray-500">Paid</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {paidPayments}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-6">
                                <p className="text-sm font-medium text-gray-500">Pending</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {pendingPayments}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Merchant</h2>

                            <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium text-gray-900">Name:</span>{" "}
                                    {merchant.name}
                                </p>

                                <p>
                                    <span className="font-medium text-gray-900">Email:</span>{" "}
                                    {merchant.email}
                                </p>

                                <p className="break-all">
                                    <span className="font-medium text-gray-900">Wallet:</span>{" "}
                                    {merchant.walletAddress}
                                </p>

                                <p className="break-all">
                                    <span className="font-medium text-gray-900">Merchant ID:</span>{" "}
                                    {merchant.id}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default DashboardPage;
