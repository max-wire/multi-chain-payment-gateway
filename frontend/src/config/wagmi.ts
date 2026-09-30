import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { mainnet, sepolia, bsc, polygon } from "wagmi/chains";

export const config = createConfig({
    chains: [mainnet, sepolia, bsc, polygon],

    connectors: [
        injected({
            shimDisconnect: true,
        }),
    ],

    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [bsc.id]: http(),
        [polygon.id]: http(),
    },
});
