export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    nativeToken: string;
    confirmationRequirement: number;
    isActive: boolean;
}

export const NETWORKS: Record<string, NetworkConfig> = {
    ethereum: {
        chainId: 1,
        name: "Ethereum",
        rpcUrl: process.env.ETHEREUM_RPC_URL ?? "",
        explorerUrl: "https://etherscan.io",
        nativeToken: "ETH",
        confirmationRequirement: 12,
        isActive: true,
    },

    bnb: {
        chainId: 56,
        name: "BNB Chain",
        rpcUrl: process.env.BNB_RPC_URL ?? "",
        explorerUrl: "https://bscscan.com",
        nativeToken: "BNB",
        confirmationRequirement: 15,
        isActive: true,
    },

    polygon: {
        chainId: 137,
        name: "Polygon",
        rpcUrl: process.env.POLYGON_RPC_URL ?? "",
        explorerUrl: "https://polygonscan.com",
        nativeToken: "POL",
        confirmationRequirement: 20,
        isActive: true,
    },

    securechain: {
        chainId: 34,
        name: "SecureChain",
        rpcUrl: process.env.SECURECHAIN_RPC_URL ?? "",
        explorerUrl: "https://explorer.securechain.ai",
        nativeToken: "SCAI",
        confirmationRequirement: Number(process.env.SECURECHAIN_CONFIRMATIONS ?? 12),
        isActive: true,
    },
};

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
    return Object.values(NETWORKS).find((network) => network.chainId === chainId);
}
