import { useAccount, useConnect, useDisconnect } from "wagmi";

export function useWallet() {
    const { address, isConnected, chainId } = useAccount();

    const { connect, connectors, isPending, error } = useConnect();

    const { disconnect } = useDisconnect();

    const connectWallet = (connectorId?: string) => {
        const connector = connectorId
            ? connectors.find((item) => item.id === connectorId)
            : undefined;

        if (connector) {
            connect({ connector });
        }
    };

    const disconnectWallet = () => {
        disconnect();
    };

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

    return {
        address,
        shortAddress,
        chainId,
        isConnected,
        isPending,
        error,
        connectors,
        connectWallet,
        disconnectWallet,
    };
}
