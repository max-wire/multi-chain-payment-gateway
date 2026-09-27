import { Router } from "express";
import {
    createPaymentController,
    getPaymentController,
    getMerchantPaymentsController,
} from "../controllers/paymentController.js";

const router = Router();

router.post("/", createPaymentController);
router.get("/merchant/:merchantId", getMerchantPaymentsController);
router.get("/:paymentId", getPaymentController);

export default router;
