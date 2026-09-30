export interface SupportedToken {
    name: string;
    symbol: string;
    address: `0x${string}`;
    decimals: number;
}

export interface NetworkConfig {
    key: string;
    chainId: number;
    name: string;
    nativeToken: string;
    explorerUrl: string;
    supportedTokens: SupportedToken[];
    isTestnet: boolean;
    isPaymentEnabled: boolean;
}

export const NETWORKS: NetworkConfig[] = [
    {
        key: "ethereum",
        chainId: 1,
        name: "Ethereum",
        nativeToken: "ETH",
        explorerUrl: "https://etherscan.io",
        supportedTokens: [],
        isTestnet: false,
        isPaymentEnabled: false,
    },
    {
        key: "sepolia",
        chainId: 11155111,
        name: "Ethereum Sepolia",
        nativeToken: "ETH",
        explorerUrl: "https://sepolia.etherscan.io",
        supportedTokens: [],
        isTestnet: true,
        isPaymentEnabled: true,
    },
    {
        key: "bnb",
        chainId: 56,
        name: "BNB Chain",
        nativeToken: "BNB",
        explorerUrl: "https://bscscan.com",
        supportedTokens: [],
        isTestnet: false,
        isPaymentEnabled: false,
    },
    {
        key: "polygon",
        chainId: 137,
        name: "Polygon",
        nativeToken: "POL",
        explorerUrl: "https://polygonscan.com",
        supportedTokens: [],
        isTestnet: false,
        isPaymentEnabled: false,
    },
    {
        key: "securechain",
        chainId: 34,
        name: "SecureChain",
        nativeToken: "SCAI",
        explorerUrl: "https://explorer.securechain.ai",
        supportedTokens: [],
        isTestnet: false,
        isPaymentEnabled: false,
    },
];

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
    return NETWORKS.find((network) => network.chainId === chainId);
}
