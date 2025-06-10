const express = require('express');
const { uploadWorkout, listWorkouts, deleteWorkout, listWorkoutsInRange  } = require('../controllers/workoutController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');
const router = express.Router();



router.post('/upload', authMiddleware, checkRole('superadmin'), uploadWorkout);
router.get('/', authMiddleware, listWorkouts);
router.delete('/:id', authMiddleware, checkRole('superadmin'), deleteWorkout);
router.get('/range', authMiddleware, listWorkoutsInRange);
router.get('/month', authMiddleware, getWorkoutsByMonth);


module.exports = router;
