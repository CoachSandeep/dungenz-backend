const cron = require('node-cron');
const admin = require('firebase-admin');
const PushToken = require('../models/PushToken');

// Schedule job at 9 PM IST (UTC +5:30)
cron.schedule('30 15 * * *', async () => {
  console.log('🕘 Sending daily workout notification at 9PM IST...');

  try {
    const tokens = await PushToken.find().select('token -_id');
    const tokenList = [...new Set(tokens.map(t => t.token).filter(Boolean))];

    if (tokenList.length === 0) {
      console.log('⚠️ No push tokens found.');
      return;
    }

    const messages = tokenList.map(token => ({
      token,
      notification: {
        title: '💪 Workout Just Dropped!!',
        body: 'Your workout for tomorrow is now live on DUNGENZ 🔥',
      },
      data: {
        screen: 'Workouts',
      }
    }));

    const response = await admin.messaging().sendEach(messages);

    console.log(`✅ Push Sent: ${response.successCount} success, ${response.failureCount} failed`);
  } catch (err) {
    console.error('❌ Error sending push:', err);
  }
});
