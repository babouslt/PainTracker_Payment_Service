const axios = require("axios");

// Test de l'annulation d'abonnement
async function testCancelSubscription() {
  try {
    console.log("Test de l'annulation d'abonnement...");

    // ID d'abonnement réel
    const subscriptionId = "sub_1RhtphIGGSYd3ARbL6iJIfPk";

    console.log(
      `URL: http://localhost:3003/api/subscriptions/${subscriptionId}/cancel`
    );

    const response = await axios.put(
      `http://localhost:3003/api/subscriptions/${subscriptionId}/cancel`,
      { cancelAtPeriodEnd: true },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
      }
    );

    console.log("Réponse de l'annulation:", response.data);
  } catch (error) {
    console.error(
      "Erreur lors du test d'annulation:",
      error.response?.data || error.message
    );
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    }
  }
}

// Test de récupération d'abonnement
async function testGetSubscription() {
  try {
    console.log("Test de récupération d'abonnement...");

    const subscriptionId = "sub_1RhtphIGGSYd3ARbL6iJIfPk";

    const response = await axios.get(
      `http://localhost:3003/api/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: "Bearer test-token",
        },
      }
    );

    console.log("Réponse de récupération:", response.data);
  } catch (error) {
    console.error(
      "Erreur lors du test de récupération:",
      error.response?.data || error.message
    );
  }
}

// Exécuter les tests
testCancelSubscription();
// testGetSubscription(); // Décommenter pour tester la récupération
