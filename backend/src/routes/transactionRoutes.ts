import { Router } from "express";

import { verifyTransactionController } from "../controllers/transactionController.js";

const router = Router();

router.post("/verify", verifyTransactionController);

export default router;
