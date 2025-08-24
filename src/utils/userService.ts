import axios from "axios";

const BDD_SERVICE_URL =
  process.env.BDD_SERVICE_URL || "http://localhost:3004/api";

export const updateUserToPremium = async (userId: string, token: string) => {
  try {
    const userRes = await axios.get(`${BDD_SERVICE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const currentCount = userRes.data?.user?.aiUsageCount ?? 0;
    const response = await axios.put(
      `${BDD_SERVICE_URL}/users/${userId}`,
      { isPremium: true, aiUsageCount: currentCount + 20 },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeUserFromPremium = async (userId: string, token: string) => {
  try {
    const response = await axios.put(
      `${BDD_SERVICE_URL}/users/${userId}`,
      { isPremium: false },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserSubscriptionId = async (
  userId: string,
  subscriptionId: string,
  token: string
) => {
  try {
    const response = await axios.put(
      `${BDD_SERVICE_URL}/users/${userId}`,
      { stripeSubscriptionId: subscriptionId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId: string, token: string) => {
  try {
    const response = await axios.get(`${BDD_SERVICE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    throw error;
  }
};
