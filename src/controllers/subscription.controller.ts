import { Request, Response } from "express";
import Stripe from "stripe";
import { Subscription } from "../models/subscription.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const BDD_API_URL = process.env.BDD_API_URL || "http://localhost:3004/api";

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(400).json({ error: "Webhook secret not configured" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  try {
    if (session.mode === "subscription" && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      if (subscription.metadata.userId) {
        // Mettre à jour l'utilisateur en base de données
        await updateUserPremiumStatus(subscription.metadata.userId, true);

        // Sauvegarder l'abonnement
        await saveSubscription(subscription);
      }
    }
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    if (subscription.metadata.userId) {
      // Mettre à jour l'utilisateur en base de données
      await updateUserPremiumStatus(subscription.metadata.userId, true);

      // Sauvegarder l'abonnement
      await saveSubscription(subscription);
    }
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    if (subscription.metadata.userId) {
      const isPremium = subscription.status === "active";

      // Mettre à jour l'utilisateur en base de données
      await updateUserPremiumStatus(subscription.metadata.userId, isPremium);

      // Mettre à jour l'abonnement en base de données
      await updateSubscription(subscription);
    }
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    if (subscription.metadata.userId) {
      // Retirer le statut premium de l'utilisateur
      await updateUserPremiumStatus(subscription.metadata.userId, false);

      // Marquer l'abonnement comme supprimé
      await markSubscriptionAsDeleted(subscription.id);
    }
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      );

      if (subscription.metadata.userId) {
        // Mettre à jour l'utilisateur en base de données
        await updateUserPremiumStatus(subscription.metadata.userId, true);

        // Mettre à jour le statut de l'abonnement
        await updateSubscriptionStatus(subscription.id, "active");
      }
    }
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      );

      if (subscription.metadata.userId) {
        // Retirer le statut premium de l'utilisateur
        await updateUserPremiumStatus(subscription.metadata.userId, false);

        // Mettre à jour le statut de l'abonnement
        await updateSubscriptionStatus(subscription.id, "past_due");
      }
    }
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
  }
}

// Fonctions utilitaires pour communiquer avec le BDDService
async function updateUserPremiumStatus(userId: string, isPremium: boolean) {
  try {
    const response = await fetch(`${BDD_API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isPremium }),
    });

    if (!response.ok) {
      console.error(`Failed to update user ${userId} premium status`);
    }
  } catch (error) {
    console.error("Error updating user premium status:", error);
  }
}

async function saveSubscription(subscription: Stripe.Subscription) {
  try {
    const subscriptionData = {
      userId: subscription.metadata.userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price?.id || "unknown",
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
    };

    const newSubscription = new Subscription(subscriptionData);
    await newSubscription.save();
  } catch (error) {
    console.error("Error saving subscription:", error);
  }
}

async function updateSubscription(subscription: Stripe.Subscription) {
  try {
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : null,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      }
    );
  } catch (error) {
    console.error("Error updating subscription:", error);
  }
}

async function markSubscriptionAsDeleted(subscriptionId: string) {
  try {
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      { status: "canceled" }
    );
  } catch (error) {
    console.error("Error marking subscription as deleted:", error);
  }
}

async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string
) {
  try {
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      { status }
    );
  } catch (error) {
    console.error("Error updating subscription status:", error);
  }
}
