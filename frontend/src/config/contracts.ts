export const PAYMENT_GATEWAY_ADDRESS = "0xED0D8DCE8A44C738A4800a10A1F0594a666cC3d0" as const;

export const PAYMENT_GATEWAY_ABI = [
    {
        type: "function",
        name: "createPayment",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "token",
                type: "address",
            },
            {
                name: "amount",
                type: "uint256",
            },
            {
                name: "expiresAt",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "paymentId",
                type: "bytes32",
            },
        ],
    },
    {
        type: "function",
        name: "getPayment",
        stateMutability: "view",
        inputs: [
            {
                name: "paymentId",
                type: "bytes32",
            },
        ],
        outputs: [
            {
                name: "payment",
                type: "tuple",
                components: [
                    {
                        name: "paymentId",
                        type: "bytes32",
                    },
                    {
                        name: "merchant",
                        type: "address",
                    },
                    {
                        name: "token",
                        type: "address",
                    },
                    {
                        name: "amount",
                        type: "uint256",
                    },
                    {
                        name: "createdAt",
                        type: "uint256",
                    },
                    {
                        name: "expiresAt",
                        type: "uint256",
                    },
                    {
                        name: "status",
                        type: "uint8",
                    },
                ],
            },
        ],
    },
    {
        type: "function",
        name: "payNative",
        stateMutability: "payable",
        inputs: [
            {
                name: "paymentId",
                type: "bytes32",
            },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "payToken",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "paymentId",
                type: "bytes32",
            },
        ],
        outputs: [],
    },
    {
        type: "event",
        name: "PaymentCreated",
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: "paymentId",
                type: "bytes32",
            },
            {
                indexed: true,
                name: "merchant",
                type: "address",
            },
            {
                indexed: true,
                name: "token",
                type: "address",
            },
            {
                indexed: true,
                name: "amount",
                type: "uint256",
            },
            {
                indexed: false,
                name: "expiresAt",
                type: "uint256",
            },
        ],
    },
    {
        type: "event",
        name: "PaymentReceived",
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: "paymentId",
                type: "bytes32",
            },
            {
                indexed: true,
                name: "payer",
                type: "address",
            },
            {
                indexed: true,
                name: "merchant",
                type: "address",
            },
            {
                indexed: false,
                name: "token",
                type: "address",
            },
            {
                indexed: false,
                name: "amount",
                type: "uint256",
            },
        ],
    },
] as const;
