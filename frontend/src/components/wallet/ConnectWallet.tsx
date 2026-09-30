import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";

function ConnectWallet() {
    const {
        address,
        shortAddress,
        isConnected,
        isPending,
        connectors,
        connectWallet,
        disconnectWallet,
    } = useWallet();

    const [showWallets, setShowWallets] = useState(false);
    const [showAccount, setShowAccount] = useState(false);

    if (isConnected) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowAccount((open) => !open)}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                    {shortAddress}
                </button>

                {showAccount && (
                    <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                        <div className="border-b border-gray-100 px-3 py-2">
                            <p className="text-xs text-gray-500">Connected wallet</p>

                            <p className="mt-1 truncate text-sm font-medium text-gray-900">
                                {address}
                            </p>
                        </div>

                        <button
                            onClick={async () => {
                                if (address) {
                                    await navigator.clipboard.writeText(address);
                                }
                            }}
                            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Copy Address
                        </button>

                        <button
                            onClick={() => {
                                disconnectWallet();
                                setShowAccount(false);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowWallets((open) => !open)}
                disabled={isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? "Connecting..." : "Connect Wallet"}
            </button>

            {showWallets && !isPending && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    <p className="px-3 py-2 text-sm font-semibold text-gray-900">
                        Connect a wallet
                    </p>

                    {connectors
                        .filter((connector) => connector.name !== "Injected")
                        .map((connector) => (
                            <button
                                key={connector.uid}
                                onClick={() => {
                                    connectWallet(connector.id);
                                    setShowWallets(false);
                                }}
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {connector.name}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}

export default ConnectWallet;
