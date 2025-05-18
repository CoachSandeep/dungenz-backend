const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const adminWorkouts = require('./routes/adminWorkouts');
const settings = require('./routes/settings');

dotenv.config();
const app = express();

const corsOptions = {
  origin: 'https://dungenz-frontend.onrender.com', // ✅ Your frontend domain
  credentials: true, // ✅ Send cookies/tokens if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
// Handle OPTIONS requests (preflight)
// app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/api/admin/workouts', adminWorkouts);

const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');

// const settingsRoutes = require('./routes/settings');
app.use('/api/settings', settings);

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to DUNGENZ API 🚀');
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
