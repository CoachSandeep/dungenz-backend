const cron = require('node-cron');
const admin = require('firebase-admin');
const PushToken = require('../models/PushToken');

// Schedule job at 9 PM IST (UTC +5:30)
cron.schedule('35 15 * * *', async () => {
    console.log('🕘 Notification task running at 9PM IST...');

    const ist = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const day = new Date(ist).toLocaleDateString('en-US', { weekday: 'long' });
    const isRestDay = (day === 'Wednesday' || day === 'Saturday');
  
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
          title: isRestDay ? '🛌 REST MODE ON' : '💪 Workout Just Dropped!!',
          body: isRestDay
            ? 'Recovery is part of the grind. Take rest, warrior!'
            : 'Your workout for tomorrow is now live on DUNGENZ 🔥',
        },
        android: {
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default', // ✅ This enables sound on iPhones
            },
          },
        },
        data: {
          screen: 'Workouts',
        },
      }));
  
      const response = await admin.messaging().sendEach(messages);
      console.log(`✅ Push Sent: ${response.successCount} success, ${response.failureCount} failed`);
    } catch (err) {
      console.error('❌ Error sending push:', err);
    }
});
