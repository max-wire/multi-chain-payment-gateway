import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { NETWORKS } from "../config/networks";

function LandingPage() {
    return (
        <main className="min-h-screen bg-white">
            {" "}
            <Navbar />
            <section className="mx-auto max-w-7xl px-6 py-24">
                <div className="max-w-3xl">
                    <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                        Multi-Chain Payment Gateway
                    </p>

                    <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900 md:text-7xl">
                        One Gateway.
                        <br />
                        Multiple Chains.
                    </h1>

                    <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
                        Accept crypto payments across multiple blockchain networks from one simple,
                        non-custodial payment platform.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            to="/create-payment"
                            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Start Accepting Payments
                        </Link>

                        <Link
                            to="/transactions"
                            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            View Transactions
                        </Link>
                    </div>
                </div>

                <section className="mt-24">
                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                            Supported Networks
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-gray-900">
                            One payment experience across multiple chains
                        </h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {NETWORKS.map((network) => (
                            <div
                                key={network.key}
                                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                                        {network.nativeToken}
                                    </div>

                                    {network.isPaymentEnabled ? (
                                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                            Payment Ready
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                                            Coming Soon
                                        </span>
                                    )}
                                </div>

                                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                                    {network.name}
                                </h3>

                                <p className="mt-2 text-sm text-gray-500">
                                    Chain ID: {network.chainId}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    );
}

export default LandingPage;
