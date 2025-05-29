// controllers/pushController.js
const PushToken = require('../models/PushToken');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

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

    const message = {
      notification: { title, body },
      tokens: tokenList
    };

    const response = await admin.messaging().sendMulticast(message);

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
