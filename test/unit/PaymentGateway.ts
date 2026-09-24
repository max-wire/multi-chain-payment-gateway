import { expect } from "chai";
import { network } from "hardhat";
import type { ContractTransactionResponse } from "ethers";

interface PaymentGatewayContract {
    createPayment(
        token: string,
        amount: bigint,
        expiresAt: bigint,
    ): Promise<ContractTransactionResponse>;

    payNative(
        paymentId: string,
        overrides?: { value?: bigint },
    ): Promise<ContractTransactionResponse>;

    payToken(paymentId: string): Promise<ContractTransactionResponse>;

    cancelPayment(paymentId: string): Promise<ContractTransactionResponse>;

    paymentExists(paymentId: string): Promise<boolean>;

    getPayment(paymentId: string): Promise<{
        paymentId: string;
        merchant: string;
        token: string;
        amount: bigint;
        createdAt: bigint;
        expiresAt: bigint;
        status: bigint;
    }>;

    getAddress(): Promise<string>;
}

interface MockERC20Contract {
    mint(to: string, amount: bigint): Promise<ContractTransactionResponse>;

    approve(spender: string, amount: bigint): Promise<ContractTransactionResponse>;

    balanceOf(account: string): Promise<bigint>;

    getAddress(): Promise<string>;
}

/**
 * Hardhat 3's connect() returns BaseContract,
 * so explicitly restore our contract interface.
 */
function connectGateway(gateway: any, signer: any): PaymentGatewayContract {
    return gateway.connect(signer) as PaymentGatewayContract;
}

function connectToken(token: any, signer: any): MockERC20Contract {
    return token.connect(signer) as MockERC20Contract;
}

describe("PaymentGateway", function () {
    let ethers: Awaited<ReturnType<typeof network.getOrCreate>>["ethers"];

    let merchant: any;
    let payer: any;
    let attacker: any;

    before(async function () {
        ({ ethers } = await network.getOrCreate());

        [merchant, payer, attacker] = await ethers.getSigners();
    });

    async function deployGateway() {
        const Gateway = await ethers.getContractFactory<[], PaymentGatewayContract>(
            "PaymentGateway",
            merchant,
        );

        const gateway = await Gateway.deploy();

        await gateway.waitForDeployment();

        return gateway;
    }

    async function deployToken() {
        const Token = await ethers.getContractFactory<[], MockERC20Contract>("MockERC20", merchant);

        const token = await Token.deploy();

        await token.waitForDeployment();

        return token;
    }

    async function futureExpiry(seconds = 24 * 60 * 60): Promise<bigint> {
        const latestBlock = await ethers.provider.getBlock("latest");

        return BigInt(latestBlock!.timestamp + seconds);
    }

    async function createPayment(
        gateway: PaymentGatewayContract,
        token: string,
        amount: bigint,
        expiry?: bigint,
    ): Promise<string> {
        const expiresAt = expiry ?? (await futureExpiry());

        const tx = await gateway.createPayment(token, amount, expiresAt);

        const receipt = await tx.wait();

        const paymentCreatedInterface = new ethers.Interface([
            "event PaymentCreated(bytes32 indexed paymentId,address indexed merchant,address indexed token,uint256 amount,uint256 expiresAt)",
        ]);

        for (const log of receipt!.logs) {
            try {
                const parsed = paymentCreatedInterface.parseLog({
                    topics: [...log.topics],
                    data: log.data,
                });

                if (parsed?.name === "PaymentCreated") {
                    return parsed.args.paymentId;
                }
            } catch {
                // Ignore logs belonging to other contracts.
            }
        }

        throw new Error("PaymentCreated event not found");
    }

    async function increaseTime(seconds: number) {
        await ethers.provider.send("evm_increaseTime", [seconds]);
        await ethers.provider.send("evm_mine", []);
    }

    /*//////////////////////////////////////////////////////////////
                        createPayment()
  //////////////////////////////////////////////////////////////*/

    describe("createPayment()", function () {
        it("creates native payment", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");
            const expiresAt = await futureExpiry();

            const tx = await gateway.createPayment(ethers.ZeroAddress, amount, expiresAt);

            await expect(tx)
                .to.emit(gateway, "PaymentCreated")
                .withArgs(
                    (value: string) => value.length === 66,
                    merchant.address,
                    ethers.ZeroAddress,
                    amount,
                    expiresAt,
                );
        });

        it("creates ERC20 payment", async function () {
            const gateway = await deployGateway();
            const token = await deployToken();

            const amount = ethers.parseEther("100");
            const expiresAt = await futureExpiry();

            const tx = await gateway.createPayment(await token.getAddress(), amount, expiresAt);

            await expect(tx)
                .to.emit(gateway, "PaymentCreated")
                .withArgs(
                    (value: string) => value.length === 66,
                    merchant.address,
                    await token.getAddress(),
                    amount,
                    expiresAt,
                );
        });

        it("rejects zero amount", async function () {
            const gateway = await deployGateway();
            const expiresAt = await futureExpiry();

            await expect(
                gateway.createPayment(ethers.ZeroAddress, 0n, expiresAt),
            ).to.be.revertedWithCustomError(gateway, "InvalidAmount");
        });

        it("rejects expired payment", async function () {
            const gateway = await deployGateway();

            const latestBlock = await ethers.provider.getBlock("latest");

            const expiresAt = BigInt(latestBlock!.timestamp);

            await expect(
                gateway.createPayment(ethers.ZeroAddress, ethers.parseEther("1"), expiresAt),
            ).to.be.revertedWithCustomError(gateway, "InvalidExpiry");
        });

        it("stores all payment fields", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("2");
            const expiresAt = await futureExpiry();

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount, expiresAt);

            const payment = await gateway.getPayment(paymentId);

            expect(payment.paymentId).to.equal(paymentId);
            expect(payment.merchant).to.equal(merchant.address);
            expect(payment.token).to.equal(ethers.ZeroAddress);
            expect(payment.amount).to.equal(amount);
            expect(payment.expiresAt).to.equal(expiresAt);
            expect(payment.status).to.equal(0n);
            expect(payment.createdAt).to.be.greaterThan(0n);
        });

        it("generates unique payment IDs", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const firstPaymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            const secondPaymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            expect(firstPaymentId).to.not.equal(secondPaymentId);
        });
    });

    /*//////////////////////////////////////////////////////////////
                           payNative()
  //////////////////////////////////////////////////////////////*/

    describe("payNative()", function () {
        it("successfully pays a native payment", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            const tx = await connectGateway(gateway, payer).payNative(paymentId, {
                value: amount,
            });

            await expect(tx)
                .to.emit(gateway, "PaymentReceived")
                .withArgs(paymentId, payer.address, merchant.address, ethers.ZeroAddress, amount);
        });

        it("sends exact amount to merchant", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            const balanceBefore = await ethers.provider.getBalance(merchant.address);

            await connectGateway(gateway, payer).payNative(paymentId, {
                value: amount,
            });

            const balanceAfter = await ethers.provider.getBalance(merchant.address);

            expect(balanceAfter - balanceBefore).to.equal(amount);
        });

        it("rejects wrong amount", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            await expect(
                connectGateway(gateway, payer).payNative(paymentId, {
                    value: ethers.parseEther("0.5"),
                }),
            ).to.be.revertedWithCustomError(gateway, "IncorrectPaymentAmount");
        });

        it("rejects ERC20 payment", async function () {
            const gateway = await deployGateway();
            const token = await deployToken();

            const amount = ethers.parseEther("100");

            const paymentId = await createPayment(gateway, await token.getAddress(), amount);

            await expect(
                connectGateway(gateway, payer).payNative(paymentId, {
                    value: amount,
                }),
            ).to.be.revertedWithCustomError(gateway, "InvalidToken");
        });

        it("rejects nonexistent payment", async function () {
            const gateway = await deployGateway();

            const fakePaymentId = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));

            await expect(
                connectGateway(gateway, payer).payNative(fakePaymentId, {
                    value: ethers.parseEther("1"),
                }),
            ).to.be.revertedWithCustomError(gateway, "PaymentNotFound");
        });

        it("rejects double payment", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            await connectGateway(gateway, payer).payNative(paymentId, {
                value: amount,
            });

            await expect(
                connectGateway(gateway, payer).payNative(paymentId, {
                    value: amount,
                }),
            ).to.be.revertedWithCustomError(gateway, "PaymentAlreadyPaid");
        });

        it("rejects cancelled payment", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            await gateway.cancelPayment(paymentId);

            await expect(
                connectGateway(gateway, payer).payNative(paymentId, {
                    value: amount,
                }),
            ).to.be.revertedWithCustomError(gateway, "PaymentAlreadyCancelled");
        });

        it("rejects expired payment", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            await increaseTime(24 * 60 * 60 + 1);

            await expect(
                connectGateway(gateway, payer).payNative(paymentId, {
                    value: amount,
                }),
            ).to.be.revertedWithCustomError(gateway, "PaymentExpired");
        });
    });

    /*//////////////////////////////////////////////////////////////
                           payToken()
  //////////////////////////////////////////////////////////////*/

    describe("payToken()", function () {
        it("successfully pays an ERC20 payment", async function () {
            const gateway = await deployGateway();
            const token = await deployToken();

            const amount = ethers.parseEther("100");

            await token.mint(payer.address, amount);

            const paymentId = await createPayment(gateway, await token.getAddress(), amount);

            await connectToken(token, payer).approve(await gateway.getAddress(), amount);

            const tx = await connectGateway(gateway, payer).payToken(paymentId);

            await expect(tx)
                .to.emit(gateway, "PaymentReceived")
                .withArgs(
                    paymentId,
                    payer.address,
                    merchant.address,
                    await token.getAddress(),
                    amount,
                );
        });

        it("transfers exact amount to merchant", async function () {
            const gateway = await deployGateway();
            const token = await deployToken();

            const amount = ethers.parseEther("100");

            await token.mint(payer.address, amount);

            const paymentId = await createPayment(gateway, await token.getAddress(), amount);

            await connectToken(token, payer).approve(await gateway.getAddress(), amount);

            const merchantBefore = await token.balanceOf(merchant.address);

            await connectGateway(gateway, payer).payToken(paymentId);

            const merchantAfter = await token.balanceOf(merchant.address);

            expect(merchantAfter - merchantBefore).to.equal(amount);
        });

        it("rejects native payment", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            await expect(
                connectGateway(gateway, payer).payToken(paymentId),
            ).to.be.revertedWithCustomError(gateway, "InvalidToken");
        });

        it("rejects insufficient allowance", async function () {
            const gateway = await deployGateway();
            const token = await deployToken();

            const amount = ethers.parseEther("100");

            await token.mint(payer.address, amount);

            const paymentId = await createPayment(gateway, await token.getAddress(), amount);

            await connectToken(token, payer).approve(await gateway.getAddress(), amount - 1n);

            await expect(connectGateway(gateway, payer).payToken(paymentId)).to.be.revert(ethers);
        });

        it("rejects double payment", async function () {
            const gateway = await deployGateway();
            const token = await deployToken();

            const amount = ethers.parseEther("100");

            await token.mint(payer.address, amount);

            const paymentId = await createPayment(gateway, await token.getAddress(), amount);

            await connectToken(token, payer).approve(await gateway.getAddress(), amount);

            await connectGateway(gateway, payer).payToken(paymentId);

            await expect(
                connectGateway(gateway, payer).payToken(paymentId),
            ).to.be.revertedWithCustomError(gateway, "PaymentAlreadyPaid");
        });

        it("rejects cancelled payment", async function () {
            const gateway = await deployGateway();
            const token = await deployToken();

            const amount = ethers.parseEther("100");

            await token.mint(payer.address, amount);

            const paymentId = await createPayment(gateway, await token.getAddress(), amount);

            await gateway.cancelPayment(paymentId);

            await connectToken(token, payer).approve(await gateway.getAddress(), amount);

            await expect(
                connectGateway(gateway, payer).payToken(paymentId),
            ).to.be.revertedWithCustomError(gateway, "PaymentAlreadyCancelled");
        });

        it("rejects expired payment", async function () {
            const gateway = await deployGateway();
            const token = await deployToken();

            const amount = ethers.parseEther("100");

            await token.mint(payer.address, amount);

            const paymentId = await createPayment(gateway, await token.getAddress(), amount);

            await connectToken(token, payer).approve(await gateway.getAddress(), amount);

            await increaseTime(24 * 60 * 60 + 1);

            await expect(
                connectGateway(gateway, payer).payToken(paymentId),
            ).to.be.revertedWithCustomError(gateway, "PaymentExpired");
        });
    });

    /*//////////////////////////////////////////////////////////////
                         cancelPayment()
  //////////////////////////////////////////////////////////////*/

    describe("cancelPayment()", function () {
        it("allows merchant to cancel", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            const tx = await gateway.cancelPayment(paymentId);

            await expect(tx)
                .to.emit(gateway, "PaymentCancelled")
                .withArgs(paymentId, merchant.address);

            const payment = await gateway.getPayment(paymentId);

            expect(payment.status).to.equal(2n);
        });

        it("rejects cancellation by non-merchant", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            await expect(
                connectGateway(gateway, attacker).cancelPayment(paymentId),
            ).to.be.revertedWithCustomError(gateway, "Unauthorized");
        });

        it("cannot cancel paid payment", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            await connectGateway(gateway, payer).payNative(paymentId, {
                value: amount,
            });

            await expect(gateway.cancelPayment(paymentId)).to.be.revertedWithCustomError(
                gateway,
                "PaymentAlreadyPaid",
            );
        });

        it("cannot cancel twice", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("1");

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount);

            await gateway.cancelPayment(paymentId);

            await expect(gateway.cancelPayment(paymentId)).to.be.revertedWithCustomError(
                gateway,
                "PaymentAlreadyCancelled",
            );
        });
    });

    /*//////////////////////////////////////////////////////////////
                              VIEWS
  //////////////////////////////////////////////////////////////*/

    describe("views", function () {
        it("getPayment() returns stored payment", async function () {
            const gateway = await deployGateway();

            const amount = ethers.parseEther("5");
            const expiresAt = await futureExpiry();

            const paymentId = await createPayment(gateway, ethers.ZeroAddress, amount, expiresAt);

            const payment = await gateway.getPayment(paymentId);

            expect(payment.paymentId).to.equal(paymentId);
            expect(payment.merchant).to.equal(merchant.address);
            expect(payment.token).to.equal(ethers.ZeroAddress);
            expect(payment.amount).to.equal(amount);
            expect(payment.expiresAt).to.equal(expiresAt);
            expect(payment.status).to.equal(0n);
        });

        it("paymentExists() returns true for existing payment", async function () {
            const gateway = await deployGateway();

            const paymentId = await createPayment(
                gateway,
                ethers.ZeroAddress,
                ethers.parseEther("1"),
            );

            expect(await gateway.paymentExists(paymentId)).to.equal(true);
        });

        it("paymentExists() returns false for nonexistent payment", async function () {
            const gateway = await deployGateway();

            const fakePaymentId = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));

            expect(await gateway.paymentExists(fakePaymentId)).to.equal(false);
        });

        it("getPayment() rejects nonexistent payment", async function () {
            const gateway = await deployGateway();

            const fakePaymentId = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));

            await expect(gateway.getPayment(fakePaymentId)).to.be.revertedWithCustomError(
                gateway,
                "PaymentNotFound",
            );
        });
    });
});
