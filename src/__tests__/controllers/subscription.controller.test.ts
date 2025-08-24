import request from "supertest";
import express from "express";
import {
  createSubscriptionController,
  handleSubscriptionWebhook,
} from "../../controllers/subscription.controller";

// Mock des modules externes
jest.mock("../../utils/stripe", () => ({
  createCustomer: jest.fn(),
  createProduct: jest.fn(),
  createPrice: jest.fn(),
  createSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  retrieveSubscription: jest.fn(),
  constructWebhookEvent: jest.fn(),
}));

jest.mock("../../utils/userService", () => ({
  updateUserToPremium: jest.fn(),
  removeUserFromPremium: jest.fn(),
}));

// Mock de fetch global
global.fetch = jest.fn();

describe("Subscription Controller", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Routes de test
    app.post("/subscriptions/create", createSubscriptionController);
    app.post("/webhook", handleSubscriptionWebhook);

    // Reset des mocks
    jest.clearAllMocks();
  });

  describe("POST /subscriptions", () => {
    it("should create a subscription successfully", async () => {
      const mockCustomer = { id: "cus_test123" };
      const mockProduct = { id: "prod_test123" };
      const mockPrice = { id: "price_test123" };
      const mockSubscription = {
        id: "sub_test123",
        status: "incomplete",
        latest_invoice: {
          payment_intent: { client_secret: "pi_test_secret" },
        },
      };

      const stripeUtils = require("../../utils/stripe");
      stripeUtils.createCustomer.mockResolvedValue(mockCustomer);
      stripeUtils.createProduct.mockResolvedValue(mockProduct);
      stripeUtils.createPrice.mockResolvedValue(mockPrice);
      stripeUtils.createSubscription.mockResolvedValue(mockSubscription);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await request(app).post("/subscriptions/create").send({
        userId: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        amount: 6.99,
        currency: "eur",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionId).toBe("sub_test123");
      expect(response.body.data.clientSecret).toBe("pi_test_secret");
    });

    it("should return 400 if userId is missing", async () => {
      const response = await request(app).post("/subscriptions/create").send({
        email: "test@example.com",
        amount: 6.99,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("userId et email sont requis");
    });

    it("should return 400 if email is missing", async () => {
      const response = await request(app).post("/subscriptions/create").send({
        userId: "507f1f77bcf86cd799439011",
        amount: 6.99,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("userId et email sont requis");
    });

    it("should handle Stripe errors gracefully", async () => {
      const stripeUtils = require("../../utils/stripe");
      stripeUtils.createCustomer.mockRejectedValue(
        new Error("Stripe API error")
      );

      const response = await request(app).post("/subscriptions/create").send({
        userId: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        "Erreur lors de la création de l'abonnement"
      );
    });
  });

  describe("POST /webhook", () => {
    it("should return 400 if stripe signature is missing", async () => {
      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Signature Stripe manquante");
    });

    it("should handle customer.subscription.created event", async () => {
      const mockEvent = {
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_test123",
            metadata: { userId: "507f1f77bcf86cd799439011" },
            status: "active",
            customer: "cus_test123",
            items: { data: [{ price: { id: "price_test123" } }] },
          },
        },
      };

      const stripeUtils = require("../../utils/stripe");
      stripeUtils.constructWebhookEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it("should handle customer.subscription.updated event", async () => {
      const mockEvent = {
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test123",
            metadata: { userId: "507f1f77bcf86cd799439011" },
            status: "active",
          },
        },
      };

      const stripeUtils = require("../../utils/stripe");
      stripeUtils.constructWebhookEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it("should handle customer.subscription.deleted event", async () => {
      const mockEvent = {
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_test123",
            metadata: { userId: "507f1f77bcf86cd799439011" },
          },
        },
      };

      const stripeUtils = require("../../utils/stripe");
      stripeUtils.constructWebhookEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it("should handle unknown event types", async () => {
      const mockEvent = {
        type: "unknown.event.type",
        data: { object: {} },
      };

      const stripeUtils = require("../../utils/stripe");
      stripeUtils.constructWebhookEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it("should handle webhook construction errors", async () => {
      const stripeUtils = require("../../utils/stripe");
      stripeUtils.constructWebhookEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        "Erreur lors du traitement du webhook"
      );
    });
  });
});
