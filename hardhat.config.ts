import { configVariable, defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
    plugins: [hardhatToolboxMochaEthers],

    solidity: {
        version: "0.8.30",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },

    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },

    networks: {
        sepolia: {
            type: "http",
            chainId: 11155111,
            url: configVariable("ETHEREUM_RPC_URL"),
            accounts: [configVariable("PRIVATE_KEY")],
        },
    },
});
