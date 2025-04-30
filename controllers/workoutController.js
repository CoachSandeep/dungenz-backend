const Workout = require('../models/Workout');

// Upload a Workout
exports.uploadWorkout = async (req, res) => {
  const { title, description, date, version } = req.body;
  try {
    const newWorkout = await Workout.create({
      title,
      description,
      date,
      version,
      createdBy: req.user.id
    });
    res.status(201).json(newWorkout);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List Workouts (optional date filter)
exports.listWorkouts = async (req, res) => {
  const { date } = req.query;
  let filter = {};
  if (date) {
    const selectedDate = new Date(date);
    filter.date = { $gte: selectedDate, $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) };
  }
  try {
    const workouts = await Workout.find(filter).populate('createdBy', 'name');
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
