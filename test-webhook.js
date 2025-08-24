const axios = require("axios");

// Test de la route webhook
async function testWebhook() {
  try {
    console.log("Test du webhook...");

    const webhookData = {
      id: "evt_test_123",
      object: "event",
      api_version: "2023-10-16",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "pi_test_123",
          object: "payment_intent",
          amount: 699,
          currency: "eur",
          metadata: {
            userId: "507f1f77bcf86cd799439011", // ID de test
          },
          status: "succeeded",
        },
      },
      type: "payment_intent.succeeded",
    };

    const response = await axios.post(
      "http://localhost:3003/api/payments/webhook",
      webhookData,
      {
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "test_signature",
        },
      }
    );

    console.log("Réponse du webhook:", response.data);
  } catch (error) {
    console.error(
      "Erreur lors du test du webhook:",
      error.response?.data || error.message
    );
  }
}

// Test de la création de paiement
async function testCreatePayment() {
  try {
    console.log("Test de création de paiement...");

    const paymentData = {
      amount: 6.99,
      currency: "eur",
      userId: "507f1f77bcf86cd799439011",
      description: "Test abonnement premium",
    };

    const response = await axios.post(
      "http://localhost:3003/api/payments/create",
      paymentData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
      }
    );

    console.log("Paiement créé:", response.data);
  } catch (error) {
    console.error(
      "Erreur lors de la création du paiement:",
      error.response?.data || error.message
    );
  }
}

// Exécuter les tests
testCreatePayment();
// testWebhook(); // Décommenter pour tester le webhook
