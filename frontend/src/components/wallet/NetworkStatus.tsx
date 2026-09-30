import { getNetworkByChainId } from "../../config/networks";
import { useWallet } from "../../hooks/useWallet";

function NetworkStatus() {
    const { chainId, isConnected } = useWallet();

    if (!isConnected) {
        return null;
    }

    const network = chainId ? getNetworkByChainId(chainId) : undefined;

    if (!network) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Unsupported network
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border px-3 py-2 text-sm ${
                network.isPaymentEnabled
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
        >
            <div className="font-medium">{network.name}</div>

            <div className="text-xs">
                {network.isPaymentEnabled ? "Payment Ready" : "Payments unavailable"}
            </div>
        </div>
    );
}

export default NetworkStatus;
