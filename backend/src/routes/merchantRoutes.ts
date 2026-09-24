import { Router } from "express";
import {
    createMerchantController,
    getMerchantController,
} from "../controllers/merchantController.js";

const router = Router();

router.post("/", createMerchantController);
router.get("/:merchantId", getMerchantController);

export default router;
