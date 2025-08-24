import mongoose, { Schema, Document } from "mongoose";

interface ISubscription extends Document {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  stripeCustomerId: { type: String, required: true },
  stripeSubscriptionId: { type: String, required: true, unique: true },
  stripePriceId: { type: String, required: true },
  status: {
    type: String,
    enum: [
      "incomplete",
      "incomplete_expired",
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "paused",
    ],
    default: "incomplete",
  },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);
export { Subscription, ISubscription };
