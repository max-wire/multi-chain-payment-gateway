import { Link } from "react-router-dom";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { NETWORKS } from "../config/networks";

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                            <ShieldCheck className="h-4 w-4" />
                            Administration
                        </div>

                        <h1 className="text-3xl font-bold">
                            Network Management
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Overview of configured payment networks and assets.
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Networks</p>
                        <p className="mt-2 text-2xl font-bold">{NETWORKS.length}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Payment Enabled</p>
                        <p className="mt-2 text-2xl font-bold">
                            {NETWORKS.filter((network) => network.isPaymentEnabled).length}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">ERC-20 Support</p>
                        <p className="mt-2 text-2xl font-bold">Available</p>
                        <p className="mt-1 text-xs text-slate-500">
                            Token addresses configurable per network
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <div className="border-b border-slate-800 px-6 py-4">
                        <h2 className="font-semibold">Supported Networks</h2>
                    </div>

                    <div className="divide-y divide-slate-800">
                        {NETWORKS.map((network) => (
                            <div
                                key={network.key}
                                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="font-semibold">{network.name}</h3>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                network.isPaymentEnabled
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-slate-800 text-slate-400"
                                            }`}
                                        >
                                            {network.isPaymentEnabled
                                                ? "Payment Enabled"
                                                : "Inactive"}
                                        </span>

                                        {network.isTestnet && (
                                            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                                                Testnet
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
                                        <span>Chain ID: {network.chainId}</span>
                                        <span>Native: {network.nativeToken}</span>
                                        <span>
                                            Tokens: {network.supportedTokens.length}
                                        </span>
                                    </div>
                                </div>

                                <a
                                    href={network.explorerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
                                >
                                    Explorer
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-300">
                    Admin controls are currently read-only. Network activation and
                    token management remain configuration-based for this MVP.
                </div>
            </div>
        </div>
    );
}
