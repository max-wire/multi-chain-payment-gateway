import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import Navbar from "../components/layout/Navbar";
import { useWallet } from "../hooks/useWallet";
import { PAYMENT_GATEWAY_ABI, PAYMENT_GATEWAY_ADDRESS } from "../config/contracts";
import { getPayment, verifyTransaction, type Payment as ApiPayment } from "../lib/api";

const SEPOLIA_CHAIN_ID = 11155111;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface VerificationResult {
    paymentStatus: string;
    confirmations: number;
    requiredConfirmations: number;
    transaction: {
        id: string;
        txHash: string;
        chainId: string;
        senderAddress: string;
        recipientAddress: string;
        tokenAddress: string;
        amount: string;
        blockNumber: string | null;
        confirmations: number;
        status: string;
    } | null;
}

function PaymentPage() {
    const { paymentId: routePaymentId } = useParams<{
        paymentId: string;
    }>();

    const paymentId = routePaymentId;

    const { address, chainId, isConnected, connectWallet, connectors } = useWallet();

    const [backendPayment, setBackendPayment] = useState<ApiPayment | null>(null);

    const [loadingPayment, setLoadingPayment] = useState(true);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
    const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    const {
        data: transactionHash,
        writeContractAsync,
        isPending: isSubmitting,
        error: writeError,
    } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess: isMined,
        data: receipt,
    } = useWaitForTransactionReceipt({
        hash: transactionHash,
    });

    /*
     * Load the customer-facing payment record from the backend.
     */
    useEffect(() => {
        if (!paymentId) {
            setPaymentError("Missing payment ID.");
            setLoadingPayment(false);
            return;
        }

        const currentPaymentId = paymentId;
        let cancelled = false;

        async function loadPayment() {
            try {
                setLoadingPayment(true);
                setPaymentError(null);

                const response = await getPayment(currentPaymentId);

                if (!cancelled && response.data.status === "CONFIRMED") {
                    setPaymentSuccess("Payment confirmed successfully.");
                }

                if (!cancelled) {
                    setBackendPayment(response.data);
                }
            } catch (error) {
                if (!cancelled) {
                    setPaymentError(
                        error instanceof Error ? error.message : "Unable to load payment.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingPayment(false);
                }
            }
        }

        loadPayment();

        return () => {
            cancelled = true;
        };
    }, [paymentId]);

    /*
     * Read the authoritative payment configuration directly from
     * PaymentGateway.
     */
    const onChainPayment = useReadContract({
        address: PAYMENT_GATEWAY_ADDRESS,
        abi: PAYMENT_GATEWAY_ABI,
        functionName: "getPayment",
        args: paymentId ? [paymentId as `0x${string}`] : undefined,
        query: {
            enabled: Boolean(paymentId),
        },
    });

    /*
     * wagmi/viem decodes the tuple using its component names, so the
     * result is a named object rather than a positional array.
     */
    const payment = useMemo(() => {
        if (!onChainPayment.data) {
            return null;
        }

        const value = onChainPayment.data;

        return {
            paymentId: value.paymentId,
            merchant: value.merchant,
            token: value.token,
            amount: value.amount,
            createdAt: value.createdAt,
            expiresAt: value.expiresAt,
            status: value.status,
        };
    }, [onChainPayment.data]);

    const isNativePayment = payment?.token.toLowerCase() === ZERO_ADDRESS.toLowerCase();

    const formattedAmount = payment
        ? isNativePayment
            ? `${Number(payment.amount) / 1e18} ETH`
            : payment.amount.toString()
        : null;

    const isExpired = payment ? Date.now() / 1000 > Number(payment.expiresAt) : false;

    /*
     * Once the blockchain transaction is mined, send its hash to the
     * backend verification service.
     */
    useEffect(() => {
        if (!isMined || !transactionHash || !paymentId || !chainId) {
            return;
        }

        const currentPaymentId = paymentId;
        const currentChainId = chainId;
        const currentTransactionHash = transactionHash;

        let cancelled = false;

        async function verify() {
            try {
                setVerifying(true);
                setVerificationMessage(null);

                const response = (await verifyTransaction({
                    paymentId: currentPaymentId,
                    chainId: currentChainId,
                    txHash: currentTransactionHash,
                })) as {
                    success: boolean;
                    data: VerificationResult;
                };

                if (cancelled) {
                    return;
                }

                const data = response.data;

                if (data.paymentStatus === "CONFIRMED") {
                    setPaymentSuccess("Payment confirmed successfully.");

                    setVerificationMessage(
                        `Payment verified with ${data.confirmations} confirmation(s).`,
                    );
                } else {
                    setPaymentSuccess("Payment detected successfully. Waiting for confirmations.");

                    setVerificationMessage(
                        `${data.confirmations} of ${data.requiredConfirmations} confirmations.`,
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    setVerificationMessage(
                        error instanceof Error ? error.message : "Payment verification failed.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setVerifying(false);
                }
            }
        }

        verify();

        return () => {
            cancelled = true;
        };
    }, [isMined, transactionHash, paymentId, chainId]);

    async function handlePayNative() {
        if (!paymentId || !payment) {
            return;
        }

        if (!isConnected || !address) {
            const connector = connectors[0];

            if (!connector) {
                setPaymentError("No wallet connector is available.");
                return;
            }

            connectWallet(connector.id);
            return;
        }

        if (chainId !== SEPOLIA_CHAIN_ID) {
            setPaymentError("Please switch your wallet to Ethereum Sepolia before paying.");
            return;
        }

        if (!isNativePayment) {
            setPaymentError("This payment requires an ERC-20 token. Native ETH cannot be used.");
            return;
        }

        if (payment.status !== 0) {
            setPaymentError("This payment is no longer available.");
            return;
        }

        if (isExpired) {
            setPaymentError("This payment has expired.");
            return;
        }

        try {
            setPaymentError(null);
            setPaymentSuccess(null);
            setVerificationMessage(null);

            await writeContractAsync({
                address: PAYMENT_GATEWAY_ADDRESS,
                abi: PAYMENT_GATEWAY_ABI,
                functionName: "payNative",
                args: [paymentId as `0x${string}`],
                value: payment.amount,
            });
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : "Unable to submit payment.");
        }
    }

    const displayDescription = backendPayment?.description || "Payment request";

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <section className="mx-auto max-w-2xl px-6 py-16">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>

                    <p className="mt-2 text-gray-600">{displayDescription}</p>

                    {loadingPayment && (
                        <div className="mt-8 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                            Loading payment...
                        </div>
                    )}

                    {paymentError && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {paymentError}
                        </div>
                    )}

                    {onChainPayment.isLoading && !loadingPayment && (
                        <div className="mt-8 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                            Loading blockchain payment details...
                        </div>
                    )}

                    {onChainPayment.error && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Unable to load the payment from the PaymentGateway.
                        </div>
                    )}

                    {payment && (
                        <>
                            <div className="mt-8 space-y-4">
                                <div className="rounded-xl bg-gray-50 p-4">
                                    <p className="text-xs font-medium text-gray-500">Amount</p>

                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {formattedAmount}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-4">
                                    <p className="text-xs font-medium text-gray-500">Merchant</p>

                                    <p className="mt-1 break-all font-mono text-sm text-gray-900">
                                        {payment.merchant}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-4">
                                    <p className="text-xs font-medium text-gray-500">Payment ID</p>

                                    <p className="mt-1 break-all font-mono text-sm text-gray-900">
                                        {payment.paymentId}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-4">
                                    <p className="text-xs font-medium text-gray-500">Network</p>

                                    <p className="mt-1 text-sm text-gray-900">Ethereum Sepolia</p>
                                </div>
                            </div>

                            {payment.status !== 0 && !paymentSuccess && (
                                <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                                    This payment is no longer available for settlement.
                                </div>
                            )}

                            {isExpired && payment.status === 0 && (
                                <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                                    This payment has expired.
                                </div>
                            )}

                            {!paymentSuccess && !isExpired && payment.status === 0 && (
                                <button
                                    type="button"
                                    onClick={handlePayNative}
                                    disabled={isSubmitting || isConfirming || verifying}
                                    className="mt-8 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting
                                        ? "Confirm in wallet..."
                                        : isConfirming
                                          ? "Waiting for confirmation..."
                                          : verifying
                                            ? "Verifying payment..."
                                            : isConnected
                                              ? "Pay with ETH"
                                              : "Connect Wallet"}
                                </button>
                            )}

                            {writeError && (
                                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {writeError.message}
                                </div>
                            )}

                            {transactionHash && (
                                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                                    <p className="text-xs font-medium text-gray-500">
                                        Transaction Hash
                                    </p>

                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 block break-all font-mono text-sm text-indigo-600 hover:text-indigo-700"
                                    >
                                        {transactionHash}
                                    </a>

                                    {receipt && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            Transaction mined in block{" "}
                                            {receipt.blockNumber.toString()}.
                                        </p>
                                    )}
                                </div>
                            )}

                            {paymentSuccess && (
                                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
                                    <p className="font-semibold text-green-800">{paymentSuccess}</p>

                                    {verificationMessage && (
                                        <p className="mt-1 text-sm text-green-700">
                                            {verificationMessage}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <Link
                        to="/"
                        className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        Back to MultiPay
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default PaymentPage;
