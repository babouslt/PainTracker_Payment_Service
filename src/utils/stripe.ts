import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default stripe;

// Créer un produit Stripe
export const createProduct = async (name: string, description?: string) => {
  try {
    const product = await stripe.products.create({
      name,
      description,
    });
    return product;
  } catch (error) {
    throw error;
  }
};

// Créer un prix récurrent
export const createPrice = async (
  productId: string,
  amount: number,
  currency: string = "eur",
  interval: "month" | "year" = "month"
) => {
  try {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100),
      currency,
      recurring: {
        interval,
      },
    });
    return price;
  } catch (error) {
    throw error;
  }
};

// Créer un abonnement
export const createSubscription = async (
  customerId: string,
  priceId: string,
  metadata: any = {}
) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });
    return subscription;
  } catch (error) {
    throw error;
  }
};

// Créer un client Stripe
export const createCustomer = async (email: string, metadata: any = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata,
    });
    return customer;
  } catch (error) {
    throw error;
  }
};

export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string
) => {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    throw error;
  }
};

// Annuler un abonnement
export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });
    return subscription;
  } catch (error) {
    throw error;
  }
};

// Récupérer un abonnement
export const retrieveSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    throw error;
  }
};
