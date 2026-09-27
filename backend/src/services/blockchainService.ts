import { ethers } from "ethers";

import { NETWORKS, type NetworkConfig } from "../config/networks.js";

const providers = new Map<number, ethers.JsonRpcProvider>();

export function getProvider(chainId: number): ethers.JsonRpcProvider {
    const network = getNetwork(chainId);

    if (!network) {
        throw new Error(`Unsupported network: ${chainId}`);
    }

    if (!network.rpcUrl) {
        throw new Error(`RPC URL is not configured for ${network.name}`);
    }

    const existingProvider = providers.get(chainId);

    if (existingProvider) {
        return existingProvider;
    }

    const provider = new ethers.JsonRpcProvider(network.rpcUrl, network.chainId);

    providers.set(chainId, provider);

    return provider;
}

export function getNetwork(chainId: number): NetworkConfig | undefined {
    return Object.values(NETWORKS).find((network) => network.chainId === chainId);
}

export async function getCurrentBlock(chainId: number): Promise<number> {
    const provider = getProvider(chainId);

    return provider.getBlockNumber();
}

export async function getTransaction(
    chainId: number,
    txHash: string,
): Promise<ethers.TransactionResponse | null> {
    const provider = getProvider(chainId);

    return provider.getTransaction(txHash);
}

export async function getTransactionReceipt(
    chainId: number,
    txHash: string,
): Promise<ethers.TransactionReceipt | null> {
    const provider = getProvider(chainId);

    return provider.getTransactionReceipt(txHash);
}

export async function getConfirmations(chainId: number, txHash: string): Promise<number> {
    const provider = getProvider(chainId);

    const transaction = await provider.getTransaction(txHash);

    if (!transaction) {
        return 0;
    }

    const currentBlock = await provider.getBlockNumber();

    if (transaction.blockNumber === null) {
        return 0;
    }

    return Math.max(0, currentBlock - transaction.blockNumber + 1);
}
