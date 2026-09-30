# Multi-Chain Payment Gateway

> One Gateway. Multiple Chains. Simple Crypto Payments.

A non-custodial Web3 payment gateway for creating crypto payment requests, connecting customer wallets, verifying blockchain transactions, and managing payments through a merchant dashboard.

## Features

- Customer wallet connection with MetaMask/browser-injected wallets
- Ethereum Sepolia payment flow
- Payment creation with unique payment IDs
- Payment links
- On-chain transaction verification
- Transaction history
- Invoice management
- Merchant dashboard
- Basic network administration panel
- Confirmation tracking
- Duplicate transaction protection
- Server-side payment verification
- ERC-20 payment support in the smart contract
- Configurable EVM network architecture

## Architecture

```text
Customer
   |
   v
Payment Page
   |
   v
Connected Wallet
   |
   v
Blockchain
   |
   v
Backend Verification Service
   |
   +--> Payment Validation
   +--> Transaction Validation
   +--> Confirmation Check
   |
   v
PostgreSQL
   |
   v
Merchant Dashboard
Technology Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
React Router
Wagmi
Viem
Backend
Node.js
Express
TypeScript
Zod
Prisma
PostgreSQL
ethers.js
Blockchain
Solidity
Hardhat
Ethereum Sepolia
EVM-compatible network configuration
Supported Networks

The gateway uses a centralized network configuration.

Network	Chain ID	Status
Ethereum	1	Configured / inactive
Ethereum Sepolia	11155111	Active and tested
BNB Chain	56	Configured / inactive
Polygon	137	Configured / inactive
SecureChain	34	Configured / inactive

Ethereum Sepolia is the currently active and tested payment network for this MVP. Additional networks are configured in the architecture and can be activated when their RPC and gateway configuration is available.

Payment Flow
Create Payment
      |
      v
Select Network
      |
      v
Generate Payment ID
      |
      v
Customer Opens Payment Link
      |
      v
Connect Wallet
      |
      v
Customer Sends Payment
      |
      v
Backend Verifies Transaction
      |
      v
Payment Confirmed
Verification

The backend does not trust frontend payment confirmation.

A transaction is verified using:

Payment ID
Chain ID
Transaction hash
Transaction receipt
Successful transaction status
PaymentReceived event
Merchant address
Token address
Payment amount
Required confirmations
Duplicate transaction protection

Transactions are uniquely protected using the combination of:

chainId + transactionHash
Smart Contract

The PaymentGateway contract supports:

Native ETH payments
ERC-20 token payments
Payment IDs
Merchant recipients
Payment status tracking
PaymentReceived events

The current deployed/tested payment flow uses native ETH on Ethereum Sepolia.

Admin Panel

The MVP includes a basic read-only admin panel at:

/admin

It displays:

Configured networks
Chain IDs
Native assets
Payment-enabled status
Testnet status
Explorer links
ERC-20 support capability

Network activation and token configuration remain configuration-based in this MVP.

Security

Security measures implemented include:

Non-custodial wallet architecture
No customer private keys or seed phrases
Server-side transaction verification
Chain ID validation
Transaction receipt validation
Payment event validation
Merchant validation
Token validation
Amount validation
Confirmation validation
Duplicate transaction protection
Zod request validation
Helmet security middleware
Environment variables for sensitive configuration

Private keys must never be committed to Git.

Project Structure
multi-chain-payment-gateway/
├── backend/
│   ├── prisma/
│   └── src/
├── contracts/
├── frontend/
│   └── src/
├── scripts/
├── test/
├── hardhat.config.ts
├── package.json
└── README.md
Local Development
Frontend
cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173
Backend
cd backend
npm install
npm run dev

Backend:

http://localhost:3000

Health check:

GET /health
Validation

Frontend production build:

cd frontend
npm run build

Backend type checking:

cd backend
npm run typecheck

Backend production build:

cd backend
npm run build
Deployment

Deployment targets:

Frontend: Vercel
Backend: Render or Railway
Database: PostgreSQL
Blockchain: Ethereum Sepolia

Production deployment details will be added after deployment.

Project Status
Completed
Payment creation
Wallet connection
Payment links
Customer payment page
On-chain transaction verification
Confirmation tracking
Transaction history
Invoice system
Merchant dashboard
Basic admin panel
Security validation
Ethereum Sepolia testing
Future Work
Activate BNB Chain
Activate Polygon
Activate SecureChain
Production ERC-20 token configurations
Multiple wallet connectors
Admin authentication and authorization
Rate limiting
Automated monitoring
Subscription payments
Fiat settlement
Advanced analytics
Repository

GitHub:

https://github.com/max-wire/multi-chain-payment-gateway
