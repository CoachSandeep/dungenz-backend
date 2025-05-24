const PushToken = require('../models/PushToken');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Save FCM Token
exports.saveToken = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  try {
    const exists = await PushToken.findOne({ token });
    if (!exists) {
      await PushToken.create({ userId, token });
    }
    res.status(200).json({ message: 'Token saved successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save token.', error: err.message });
  }
};

// Get All Tokens (Admin only)
exports.getAllTokens = async (req, res) => {
  try {
    const tokens = await PushToken.find().select('token -_id');
    res.json(tokens.map(t => t.token));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tokens', error: err.message });
  }
};

// ✅ Send Push Notification to All Users
exports.sendPushToAll = async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: 'Title and body are required.' });
  }

  try {
    const tokens = await PushToken.find().select('token -_id');
    console.log("📡 Sending to tokens:", tokens);  // Log token list
    const messages = tokens.map(({ token }) => ({
      token,
      notification: {
        title,
        body
      }
    }));

    const response = await admin.messaging().sendEach(messages);
    console.log("📬 FCM Response:", response);
    res.json({ message: 'Push sent to all devices.', response });
  } catch (err) {
    res.status(500).json({ message: 'Error sending push notifications.', error: err.message });
  }
};
