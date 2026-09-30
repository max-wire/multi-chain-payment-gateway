import { Router } from "express";

import {
    createInvoiceController,
    getInvoiceController,
    getMerchantInvoicesController,
    updateInvoiceStatusController,
} from "../controllers/invoiceController.js";

const router = Router();

router.post("/", createInvoiceController);
router.get("/merchant/:merchantId", getMerchantInvoicesController);
router.get("/:invoiceId", getInvoiceController);
router.patch("/:invoiceId/status", updateInvoiceStatusController);

export default router;
