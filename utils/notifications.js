const admin = require('firebase-admin');
const PushToken = require('../models/PushToken');

// ✅ Firebase already initialized in your main notification file, no need to reinitialize here

/**
 * Send welcome push to a specific user after registration
 * @param {String} userId - MongoDB ID of the user
 * @param {String} name - User's name for personalization
 */
exports.sendWelcomeNotification = async (userId, name = 'Warrior') => {
  try {
    const record = await PushToken.findOne({ userId });
    if (!record || !record.token) {
      console.warn("🚫 No FCM token found for user:", userId);
      return;
    }

    const message = {
      token: record.token,
      notification: {
        title: `Welcome to DUNGENZ FITNESS, ${name}!`,
        body: 'Your journey to domination starts now 🛡️🔥',
      },
      data: {
        screen: 'Home',
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Welcome notification sent:", response);
  } catch (error) {
    console.error("❌ Error sending welcome push:", error);
  }
};
