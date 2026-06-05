const axios = require("axios");

const API_URL =
  "http://4.224.186.213/evaluation-service/notifications";

// Put token in environment variable:
// set TOKEN=your_token_here (Windows CMD)
// $env:TOKEN="your_token_here" (PowerShell)
const TOKEN = process.env.TOKEN;

const WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function calculateScore(notification) {
  const weight = WEIGHTS[notification.Type] || 0;

  const recencyScore = new Date(notification.Timestamp).getTime();

  return weight * 1_000_000_000_000_000 + recencyScore;
}

async function getTop10Notifications() {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    const notifications = response.data.notifications || [];

    const rankedNotifications = notifications
      .map((notification) => ({
        ...notification,
        score: calculateScore(notification),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log("\n===== TOP 10 PRIORITY NOTIFICATIONS =====\n");

    rankedNotifications.forEach((notification, index) => {
      console.log(`${index + 1}.`);
      console.log(`ID: ${notification.ID}`);
      console.log(`Type: ${notification.Type}`);
      console.log(`Message: ${notification.Message}`);
      console.log(`Timestamp: ${notification.Timestamp}`);
      console.log("-----------------------------------");
    });
  } catch (error) {
    console.error(
      "Error fetching notifications:",
      error.response?.data || error.message
    );
  }
}

getTop10Notifications();