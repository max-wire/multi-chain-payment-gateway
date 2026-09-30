import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import paymentRoutes from "./routes/paymentRoutes.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://frontend-ten-ecru-19.vercel.app",
            "https://multi-chain-payment-gateway-c75g8gfyi-wire4.vercel.app",
            "https://multi-chain-payment-gateway-blvrnmb9l-wire4.vercel.app",
        ],
    }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Multi-Chain Payment Gateway API is running",
    });
});

app.use("/api/merchants", merchantRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
