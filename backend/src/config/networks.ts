export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    nativeToken: string;
    confirmationRequirement: number;
    gatewayAddress: string;
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
        gatewayAddress: process.env.ETHEREUM_GATEWAY_ADDRESS ?? "",
        isActive: false,
    },

    ethereumSepolia: {
        chainId: 11155111,
        name: "Ethereum Sepolia",
        rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL ?? process.env.ETHEREUM_RPC_URL ?? "",
        explorerUrl: "https://sepolia.etherscan.io",
        nativeToken: "ETH",
        confirmationRequirement: 3,
        gatewayAddress:
            process.env.ETHEREUM_SEPOLIA_GATEWAY_ADDRESS ??
            process.env.ETHEREUM_GATEWAY_ADDRESS ??
            "",
        isActive: true,
    },

    bnb: {
        chainId: 56,
        name: "BNB Chain",
        rpcUrl: process.env.BNB_RPC_URL ?? "",
        explorerUrl: "https://bscscan.com",
        nativeToken: "BNB",
        confirmationRequirement: 15,
        gatewayAddress: process.env.BNB_GATEWAY_ADDRESS ?? "",
        isActive: false,
    },

    polygon: {
        chainId: 137,
        name: "Polygon",
        rpcUrl: process.env.POLYGON_RPC_URL ?? "",
        explorerUrl: "https://polygonscan.com",
        nativeToken: "POL",
        confirmationRequirement: 20,
        gatewayAddress: process.env.POLYGON_GATEWAY_ADDRESS ?? "",
        isActive: false,
    },

    securechain: {
        chainId: 34,
        name: "SecureChain",
        rpcUrl: process.env.SECURECHAIN_RPC_URL ?? "",
        explorerUrl: "https://explorer.securechain.ai",
        nativeToken: "SCAI",
        confirmationRequirement: Number(process.env.SECURECHAIN_CONFIRMATIONS ?? 12),
        gatewayAddress: process.env.SECURECHAIN_GATEWAY_ADDRESS ?? "",
        isActive: false,
    },
};

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
    return Object.values(NETWORKS).find((network) => network.chainId === chainId);
}
