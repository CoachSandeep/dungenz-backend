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


exports.sendPushToAll = async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: 'Title and body are required.' });
  }

  try {
    const tokens = await PushToken.find().select('token -_id');
    const tokenList = tokens.map(t => t.token).filter(Boolean);

    if (tokenList.length === 0) {
      return res.status(400).json({ message: 'No tokens found.' });
    }

    // ✅ Create individual messages
    const messages = tokenList.map(token => ({
      token,
      notification: {
        title,
        body
      }
    }));

    // ✅ Send notifications
    const response = await admin.messaging().sendEach(messages);

    console.log("✅ Push sent. Success:", response.successCount, " Failures:", response.failureCount);
    res.json({
      message: 'Push sent to all devices.',
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });
  } catch (err) {
    console.error("❌ Push failed:", err);
    res.status(500).json({ message: 'Push failed.', error: err.message });
  }
};



