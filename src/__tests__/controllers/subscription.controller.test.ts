import request from "supertest";
import express from "express";

// Mock des modules externes
jest.mock("../../models/subscription.model", () => ({
  Subscription: Object.assign(
    jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({}),
    })),
    {
      findOneAndUpdate: jest.fn().mockResolvedValue({}),
    }
  ),
}));

// Mock de fetch global
global.fetch = jest.fn();

// Mock de Stripe - Mock complet du module
const mockConstructEvent = jest.fn();
const mockRetrieveSubscription = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: mockRetrieveSubscription,
    },
  }));
});

// Import après le mock
import { handleWebhook } from "../../controllers/subscription.controller";

describe("Subscription Controller", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Route de test
    app.post("/webhook", handleWebhook);

    // Reset des mocks
    jest.clearAllMocks();

    // Configuration par défaut pour les tests
    process.env.STRIPE_WEBHOOK_SECRET = "test_secret";
    process.env.STRIPE_SECRET_KEY = "test_key";
  });

  afterEach(() => {
    // Restaurer l'environnement
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe("POST /webhook", () => {
    it("should return 400 if webhook secret is not configured", async () => {
      // Simuler l'absence de webhook secret
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Webhook secret not configured");
    });

    it("should return 400 if stripe signature is missing", async () => {
      // Configurer le mock pour qu'il lève une erreur quand il n'y a pas de signature
      mockConstructEvent.mockImplementation(() => {
        throw new Error("No signature provided");
      });

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Webhook Error");
    });

    it("should handle checkout.session.completed event", async () => {
      const mockEvent = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test123",
            mode: "subscription",
            subscription: "sub_test123",
            metadata: { userId: "507f1f77bcf86cd799439011" },
          },
        },
      };

      mockConstructEvent.mockReturnValue(mockEvent);
      mockRetrieveSubscription.mockResolvedValue({
        id: "sub_test123",
        metadata: { userId: "507f1f77bcf86cd799439011" },
        customer: "cus_test123",
        items: { data: [{ price: { id: "price_test123" } }] },
        status: "active",
        current_period_start: 1234567890,
        current_period_end: 1234567890,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it("should handle customer.subscription.created event", async () => {
      const mockEvent = {
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_test123",
            metadata: { userId: "507f1f77bcf86cd799439011" },
            customer: "cus_test123",
            items: { data: [{ price: { id: "price_test123" } }] },
            status: "active",
            current_period_start: 1234567890,
            current_period_end: 1234567890,
          },
        },
      };

      mockConstructEvent.mockReturnValue(mockEvent);
      mockRetrieveSubscription.mockResolvedValue({
        id: "sub_test123",
        metadata: { userId: "507f1f77bcf86cd799439011" },
        customer: "cus_test123",
        items: { data: [{ price: { id: "price_test123" } }] },
        status: "active",
        current_period_start: 1234567890,
        current_period_end: 1234567890,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

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
            current_period_start: 1234567890,
            current_period_end: 1234567890,
          },
        },
      };

      mockConstructEvent.mockReturnValue(mockEvent);
      mockRetrieveSubscription.mockResolvedValue({
        id: "sub_test123",
        metadata: { userId: "507f1f77bcf86cd799439011" },
        status: "active",
        current_period_start: 1234567890,
        current_period_end: 1234567890,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it("should handle invoice.payment_succeeded event", async () => {
      const mockEvent = {
        type: "invoice.payment_succeeded",
        data: {
          object: {
            id: "in_test123",
            subscription: "sub_test123",
          },
        },
      };

      mockConstructEvent.mockReturnValue(mockEvent);
      mockRetrieveSubscription.mockResolvedValue({
        id: "sub_test123",
        metadata: { userId: "507f1f77bcf86cd799439011" },
        customer: "cus_test123",
        status: "active",
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

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

      mockConstructEvent.mockReturnValue(mockEvent);

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it("should handle webhook construction errors", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const response = await request(app)
        .post("/webhook")
        .send({})
        .set("stripe-signature", "test_signature")
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Webhook Error: Invalid signature");
    });
  });
});
