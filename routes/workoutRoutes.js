const express = require('express');
const { uploadWorkout, listWorkouts } = require('../controllers/workoutController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/upload', authMiddleware, uploadWorkout);
router.get('/', authMiddleware, listWorkouts);

module.exports = router;
