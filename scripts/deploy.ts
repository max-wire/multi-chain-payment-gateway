import hre from "hardhat";

async function main() {
    const connection = await hre.network.create();

    const { ethers } = connection;

    const [deployer] = await ethers.getSigners();

    const deployerAddress = await deployer.getAddress();

    console.log("Deploying PaymentGateway...");
    console.log("Deployer:", deployerAddress);

    const network = await ethers.provider.getNetwork();

    console.log("Chain ID:", network.chainId.toString());

    const gateway = await ethers.deployContract("PaymentGateway");

    await gateway.waitForDeployment();

    const gatewayAddress = await gateway.getAddress();

    console.log("PaymentGateway deployed to:", gatewayAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
