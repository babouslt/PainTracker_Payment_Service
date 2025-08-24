import request from "supertest";
import express from "express";
import subscriptionRoutes from "../../routes/subscription.route";

// Mock des contrôleurs
jest.mock("../../controllers/subscription.controller", () => ({
  handleWebhook: jest.fn((req, res) => {
    res.json({ received: true });
  }),
}));

describe("Subscription Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/subscriptions", subscriptionRoutes);

    jest.clearAllMocks();
  });

  describe("POST /api/subscriptions/webhook", () => {
    it("should route to handleWebhook", async () => {
      const response = await request(app)
        .post("/api/subscriptions/webhook")
        .send({})
        .set("stripe-signature", "test_signature");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });
  });
});
