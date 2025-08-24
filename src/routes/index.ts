import { Router } from "express";
import subscriptionRoutes from "./subscription.route";

const router = Router();

// Routes d'abonnement
router.use("/subscriptions", subscriptionRoutes);

export default router;
