const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const adminWorkouts = require('./routes/adminWorkouts');
const settings = require('./routes/settings');
const pushRoutes = require('./routes/pushRoutes');
const userRoutes = require('./routes/UserRoutes');
const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const likeCommentRoutes = require('./routes/likeCommentRoutes');
const commentRoutes = require('./routes/comments');

dotenv.config();
const app = express();

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('📁 uploads folder created');
}

const corsOptions = {
  origin: 'https://dungenz-frontend.onrender.com', // ✅ Your frontend domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Static folder to serve profile images
app.use('/uploads', express.static(uploadDir));

// ✅ Routes
app.use('/api/admin/workouts', adminWorkouts);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/settings', settings);
app.use('/api/workouts', likeCommentRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to DUNGENZ API 🚀');
});

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log(err));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
