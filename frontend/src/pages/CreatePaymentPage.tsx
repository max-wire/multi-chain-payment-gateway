import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, CircleAlert, Check, Copy, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "viem";

import { useWallet } from "../hooks/useWallet";
import { PAYMENT_GATEWAY_ABI, PAYMENT_GATEWAY_ADDRESS } from "../config/contracts";
import { createPayment } from "../lib/api";

function CreatePaymentPage() {
    const { address, isConnected } = useWallet();

    const { data: hash, isPending: isWriting, writeContract } = useWriteContract();

    const {
        data: receipt,
        isLoading: isConfirming,
        isSuccess: isConfirmed,
    } = useWaitForTransactionReceipt({
        hash,
    });

    const paymentId = receipt?.logs?.[0]?.topics?.[1];

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    const [submittedAmount, setSubmittedAmount] = useState("");
    const [submittedDescription, setSubmittedDescription] = useState("");
    const [submittedExpiresAt, setSubmittedExpiresAt] = useState("");
    const [backendSaved, setBackendSaved] = useState(false);
    const [backendError, setBackendError] = useState("");
    const [linkCopied, setLinkCopied] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!address || !isConnected) {
            return;
        }

        if (!amount || Number(amount) <= 0) {
            return;
        }

        if (!expiresAt) {
            return;
        }

        const expiresAtUnix = Math.floor(new Date(expiresAt).getTime() / 1000);

        if (expiresAtUnix <= Math.floor(Date.now() / 1000)) {
            return;
        }

        const amountInWei = parseEther(amount);

        // Capture the exact values submitted with this transaction.
        setSubmittedAmount(amount);
        setSubmittedDescription(description);
        setSubmittedExpiresAt(expiresAt);
        setBackendSaved(false);
        setBackendError("");
        setLinkCopied(false);

        writeContract({
            address: PAYMENT_GATEWAY_ADDRESS,
            abi: PAYMENT_GATEWAY_ABI,
            functionName: "createPayment",
            args: [
                "0x0000000000000000000000000000000000000000",
                amountInWei,
                BigInt(expiresAtUnix),
            ],
        });
    };

    useEffect(() => {
        if (!isConfirmed || !paymentId || !hash || !address) {
            return;
        }

        if (backendSaved) {
            return;
        }

        let cancelled = false;

        async function savePaymentToBackend() {
            const walletAddress = address;

            if (!walletAddress) {
                return;
            }

            try {
                setBackendError("");

                const storageKey = `multipay_merchant_${walletAddress.toLowerCase()}`;
                const merchantId = localStorage.getItem(storageKey);

                if (!merchantId) {
                    throw new Error(
                        "Merchant not found. Open the Dashboard first to initialize your merchant.",
                    );
                }

                const expiresAtUnix = Math.floor(
                    new Date(submittedExpiresAt).getTime() / 1000,
                );

                await createPayment({
                    merchantId,
                    paymentId: String(paymentId),
                    amount: parseEther(submittedAmount).toString(),
                    tokenAddress: "0x0000000000000000000000000000000000000000",
                    recipientAddress: walletAddress,
                    description: submittedDescription || undefined,
                    expiresAt: new Date(expiresAtUnix * 1000).toISOString(),
                });

                if (!cancelled) {
                    setBackendSaved(true);
                }
            } catch (error) {
                if (!cancelled) {
                    setBackendError(
                        error instanceof Error
                            ? error.message
                            : "Failed to save payment to backend",
                    );
                }
            }
        }

        savePaymentToBackend();

        return () => {
            cancelled = true;
        };
    }, [
        isConfirmed,
        paymentId,
        hash,
        address,
        submittedAmount,
        submittedDescription,
        submittedExpiresAt,
        backendSaved,
    ]);

    return (
        <main className="min-h-[calc(100vh-73px)] bg-gray-50 px-6 py-10">
            <div className="mx-auto max-w-3xl">
                <Link
                    to="/"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-indigo-600"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Create Payment
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Create a payment request that customers can pay directly on-chain.
                    </p>
                </div>

                {!isConnected && (
                    <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />

                        <div>
                            <p className="text-sm font-semibold text-amber-900">
                                Connect your wallet
                            </p>

                            <p className="mt-1 text-sm text-amber-700">
                                Connect your merchant wallet before creating a payment.
                            </p>
                        </div>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
                >
                    <div className="space-y-7">
                        {/* Network */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">
                                Network
                            </label>

                            <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Ethereum Sepolia
                                        </p>

                                        <p className="mt-1 text-sm text-gray-600">
                                            Sepolia test network
                                        </p>
                                    </div>

                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                                        <Check size={15} strokeWidth={3} />
                                    </div>
                                </div>

                                <div className="mt-3 text-xs font-medium text-indigo-700">
                                    Payment Ready
                                </div>
                            </div>
                        </div>

                        {/* Payment Token */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">
                                Payment Token
                            </label>

                            <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">Ethereum</p>

                                        <p className="mt-1 text-sm text-gray-600">Native ETH</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-700">
                                            ETH
                                        </span>

                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                                            <Check size={15} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label
                                htmlFor="amount"
                                className="mb-2 block text-sm font-semibold text-gray-900"
                            >
                                Amount
                            </label>

                            <div className="relative">
                                <input
                                    id="amount"
                                    type="number"
                                    min="0"
                                    step="0.000001"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    placeholder="0.001"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />

                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                                    ETH
                                </span>
                            </div>

                            <p className="mt-2 text-xs text-gray-500">
                                Enter the amount the customer should pay.
                            </p>
                        </div>

                        {/* Recipient */}
                        <div>
                            <label
                                htmlFor="recipient"
                                className="mb-2 block text-sm font-semibold text-gray-900"
                            >
                                Recipient Address
                            </label>

                            <div className="relative">
                                <input
                                    id="recipient"
                                    type="text"
                                    value={address ?? ""}
                                    readOnly
                                    placeholder="Connect your wallet"
                                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-24 text-sm font-mono text-gray-700 outline-none"
                                />

                                {isConnected && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                        Connected
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-xs text-gray-500">
                                Payments will be sent directly to your connected merchant wallet.
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="description"
                                className="mb-2 block text-sm font-semibold text-gray-900"
                            >
                                Description
                                <span className="ml-1 font-normal text-gray-400">
                                    (optional)
                                </span>
                            </label>

                            <textarea
                                id="description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="e.g. Payment for consulting services"
                                rows={3}
                                maxLength={500}
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                            <p className="mt-2 text-xs text-gray-500">
                                {description.length}/500 characters
                            </p>
                        </div>

                        {/* Expiry */}
                        <div>
                            <label
                                htmlFor="expiresAt"
                                className="mb-2 block text-sm font-semibold text-gray-900"
                            >
                                Payment Expiry
                            </label>

                            <div className="relative">
                                <Calendar
                                    size={18}
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    id="expiresAt"
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(event) => setExpiresAt(event.target.value)}
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Non-custodial notice */}
                    <div className="mt-8 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                        <CircleAlert size={18} className="mt-0.5 shrink-0 text-indigo-600" />

                        <div>
                            <p className="text-sm font-semibold text-indigo-900">
                                Non-custodial payment
                            </p>

                            <p className="mt-1 text-sm leading-5 text-indigo-700">
                                Funds are sent directly through the blockchain. MultiPay does not
                                hold customer funds.
                            </p>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!isConnected || isWriting || isConfirming}
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                    >
                        {isWriting ? (
                            <>
                                <Loader2 size={17} className="animate-spin" />
                                Confirm transaction in wallet...
                            </>
                        ) : isConfirming ? (
                            <>
                                <Loader2 size={17} className="animate-spin" />
                                Waiting for confirmation...
                            </>
                        ) : isConfirmed ? (
                            "Payment Created"
                        ) : isConnected ? (
                            "Create Payment"
                        ) : (
                            "Connect Wallet to Continue"
                        )}
                    </button>

                    {/* Transaction Result */}
                    {hash && (
                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Transaction Hash
                            </p>

                            <a
                                href={`https://sepolia.etherscan.io/tx/${hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 block truncate text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                {hash}
                            </a>
                        </div>
                    )}

                    {/* Payment Created */}
                    {isConfirmed && paymentId && (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                            <div className="flex items-center gap-2">
                                <Check size={18} className="text-green-600" />

                                <p className="text-sm font-semibold text-green-800">
                                    Payment created successfully
                                </p>
                            </div>

                            <div className="mt-4">
                                <p className="text-xs font-medium text-green-700">
                                    Payment ID
                                </p>

                                <p className="mt-1 break-all font-mono text-sm text-green-900">
                                    {paymentId}
                                </p>
                            </div>

                            {/* Backend Save Success */}
                            {backendSaved && (
                                <div className="mt-4 rounded-lg border border-green-200 bg-white p-4">
                                    <p className="text-sm font-semibold text-green-800">
                                        Payment saved to MultiPay
                                    </p>

                                    <p className="mt-1 text-xs text-green-700">
                                        Share this payment link with your customer.
                                    </p>

                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${window.location.origin}/pay/${paymentId}`}
                                            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700"
                                        />

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(
                                                    `${window.location.origin}/pay/${paymentId}`,
                                                );

                                                setLinkCopied(true);

                                                setTimeout(() => {
                                                    setLinkCopied(false);
                                                }, 2000);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                        >
                                            <Copy size={14} />
                                            {linkCopied ? "Copied" : "Copy"}
                                        </button>
                                    </div>

                                    <div className="mt-3 flex gap-3">
                                        <Link
                                            to={`/pay/${paymentId}`}
                                            target="_blank"
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                        >
                                            Open Payment Page →
                                        </Link>

                                        <Link
                                            to="/dashboard"
                                            className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                                        >
                                            Dashboard →
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Backend Save Error */}
                            {backendError && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                                    <p className="text-sm font-semibold text-red-800">
                                        Payment created on-chain, but backend save failed
                                    </p>

                                    <p className="mt-1 text-xs text-red-700">
                                        {backendError}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </main>
    );
}

export default CreatePaymentPage;