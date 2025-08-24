const axios = require("axios");

// Test de webhook pour abonnement avec statut "incomplete"
async function testIncompleteSubscription() {
  try {
    console.log("Test du webhook d'abonnement incomplete...");

    const webhookData = {
      id: "evt_test_incomplete_123",
      object: "event",
      api_version: "2023-10-16",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "sub_1RhtyXIGGSYd3ARbvP9662q8", // Votre ID d'abonnement réel
          object: "subscription",
          status: "incomplete",
          metadata: {
            userId: "686a8e4a1fa33218ac2c7a64", // Votre userId réel
          },
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 jours
        },
      },
      type: "customer.subscription.updated",
    };

    const response = await axios.post(
      "http://localhost:3003/api/subscriptions/webhook",
      webhookData,
      {
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "test_signature",
        },
      }
    );

    console.log("Réponse du webhook incomplete:", response.data);
  } catch (error) {
    console.error(
      "Erreur lors du test du webhook incomplete:",
      error.response?.data || error.message
    );
  }
}

// Test de webhook pour abonnement avec statut "active"
async function testActiveSubscription() {
  try {
    console.log("Test du webhook d'abonnement active...");

    const webhookData = {
      id: "evt_test_active_123",
      object: "event",
      api_version: "2023-10-16",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "sub_1RhtyXIGGSYd3ARbvP9662q8", // Votre ID d'abonnement réel
          object: "subscription",
          status: "active",
          metadata: {
            userId: "686a8e4a1fa33218ac2c7a64", // Votre userId réel
          },
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 jours
        },
      },
      type: "customer.subscription.updated",
    };

    const response = await axios.post(
      "http://localhost:3003/api/subscriptions/webhook",
      webhookData,
      {
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "test_signature",
        },
      }
    );

    console.log("Réponse du webhook active:", response.data);
  } catch (error) {
    console.error(
      "Erreur lors du test du webhook active:",
      error.response?.data || error.message
    );
  }
}

// Exécuter les tests
console.log("=== Test abonnement incomplete ===");
testIncompleteSubscription();

// Attendre 2 secondes puis tester le statut active
setTimeout(() => {
  console.log("\n=== Test abonnement active ===");
  testActiveSubscription();
}, 2000);
