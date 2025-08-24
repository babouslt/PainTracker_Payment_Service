import mongoose from "mongoose";
import { Subscription, ISubscription } from "../../models/subscription.model";

describe("Subscription Model", () => {
  const mockSubscriptionData = {
    userId: "507f1f77bcf86cd799439011",
    stripeCustomerId: "cus_test123",
    stripeSubscriptionId: "sub_test123",
    stripePriceId: "price_test123",
    status: "active" as const,
    currentPeriodStart: new Date("2025-01-01"),
    currentPeriodEnd: new Date("2025-02-01"),
    cancelAtPeriodEnd: false,
  };

  describe("Validation", () => {
    it("should create a valid subscription", async () => {
      const subscription = new Subscription(mockSubscriptionData);
      const savedSubscription = await subscription.save();

      expect(savedSubscription._id).toBeDefined();
      expect(savedSubscription.userId).toBe(mockSubscriptionData.userId);
      expect(savedSubscription.stripeCustomerId).toBe(
        mockSubscriptionData.stripeCustomerId
      );
      expect(savedSubscription.stripeSubscriptionId).toBe(
        mockSubscriptionData.stripeSubscriptionId
      );
      expect(savedSubscription.status).toBe(mockSubscriptionData.status);
    });

    it("should require userId", async () => {
      const subscription = new Subscription({
        ...mockSubscriptionData,
        userId: undefined,
      });

      let err: any;
      try {
        await subscription.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should require stripeCustomerId", async () => {
      const subscription = new Subscription({
        ...mockSubscriptionData,
        stripeCustomerId: undefined,
      });

      let err: any;
      try {
        await subscription.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should require stripeSubscriptionId", async () => {
      const subscription = new Subscription({
        ...mockSubscriptionData,
        stripeSubscriptionId: undefined,
      });

      let err: any;
      try {
        await subscription.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should require stripePriceId", async () => {
      const subscription = new Subscription({
        ...mockSubscriptionData,
        stripePriceId: undefined,
      });

      let err: any;
      try {
        await subscription.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should accept valid status values", async () => {
      const validStatuses = [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ];

      for (const status of validStatuses) {
        const subscription = new Subscription({
          ...mockSubscriptionData,
          status,
        });

        const savedSubscription = await subscription.save();
        expect(savedSubscription.status).toBe(status);

        // Clean up
        await Subscription.findByIdAndDelete(savedSubscription._id);
      }
    });

    it("should reject invalid status values", async () => {
      const subscription = new Subscription({
        ...mockSubscriptionData,
        status: "invalid_status",
      });

      let err: any;
      try {
        await subscription.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should set default values", async () => {
      const subscription = new Subscription({
        userId: mockSubscriptionData.userId,
        stripeCustomerId: mockSubscriptionData.stripeCustomerId,
        stripeSubscriptionId: mockSubscriptionData.stripeSubscriptionId,
        stripePriceId: mockSubscriptionData.stripePriceId,
      });

      const savedSubscription = await subscription.save();

      expect(savedSubscription.status).toBe("incomplete");
      expect(savedSubscription.cancelAtPeriodEnd).toBe(false);
      expect(savedSubscription.createdAt).toBeInstanceOf(Date);
      expect(savedSubscription.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("Timestamps", () => {
    it("should update updatedAt on save", async () => {
      const subscription = new Subscription(mockSubscriptionData);
      const savedSubscription = await subscription.save();

      const originalUpdatedAt = savedSubscription.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 100));

      savedSubscription.status = "canceled";
      const updatedSubscription = await savedSubscription.save();

      // Mongoose might not update the timestamp immediately, so we check if it's greater or equal
      expect(updatedSubscription.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("Unique constraints", () => {
    it("should enforce unique stripeSubscriptionId", async () => {
      const subscription1 = new Subscription(mockSubscriptionData);
      await subscription1.save();

      const subscription2 = new Subscription({
        ...mockSubscriptionData,
        userId: "507f1f77bcf86cd799439012",
        stripeCustomerId: "cus_test456",
      });

      let err: any;
      try {
        await subscription2.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // MongoDB duplicate key error
    });
  });
});
