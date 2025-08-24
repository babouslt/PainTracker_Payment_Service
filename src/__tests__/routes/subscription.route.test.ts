import request from "supertest";
import express from "express";
import subscriptionRoutes from "../../routes/subscription.route";

// Mock des contrôleurs
jest.mock("../../controllers/subscription.controller", () => ({
  createSubscriptionController: jest.fn((req, res) => {
    res.status(201).json({ success: true, message: "Subscription created" });
  }),
  handleSubscriptionWebhook: jest.fn((req, res) => {
    res.json({ received: true });
  }),
  cancelSubscriptionController: jest.fn((req, res) => {
    res.json({ success: true, message: "Subscription canceled" });
  }),
  getSubscriptionController: jest.fn((req, res) => {
    res.json({
      success: true,
      subscription: { id: req.params.subscriptionId },
    });
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

  describe("POST /api/subscriptions/create", () => {
    it("should route to createSubscriptionController", async () => {
      const response = await request(app)
        .post("/api/subscriptions/create")
        .send({
          userId: "507f1f77bcf86cd799439011",
          email: "test@example.com",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Subscription created");
    });
  });

  describe("POST /api/subscriptions/webhook", () => {
    it("should route to handleSubscriptionWebhook", async () => {
      const response = await request(app)
        .post("/api/subscriptions/webhook")
        .send({})
        .set("stripe-signature", "test_signature");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });
  });

  describe("PUT /api/subscriptions/:subscriptionId/cancel", () => {
    it("should route to cancelSubscriptionController", async () => {
      const response = await request(app).put(
        "/api/subscriptions/sub_test123/cancel"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Subscription canceled");
    });
  });

  describe("GET /api/subscriptions/:subscriptionId", () => {
    it("should route to getSubscriptionController", async () => {
      const response = await request(app).get("/api/subscriptions/sub_test123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription.id).toBe("sub_test123");
    });
  });
});
