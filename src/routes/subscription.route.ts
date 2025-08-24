import { Router } from "express";
import { handleWebhook } from "../controllers/subscription.controller";

const router = Router();

// Route pour les webhooks d'abonnement Stripe
router.post("/webhook", handleWebhook);

export default router;
