const Workout = require('../models/Workout');
const Settings = require('../models/settings');

// Upload a Workout
exports.uploadWorkout = async (req, res) => {
  const { title, description, date, version, capTime, instructions, customName, icon } = req.body;
  try {
    const newWorkout = await Workout.create({
      title,
      description,
      date,
      version,
      capTime,
      instructions,
      customName,
      icon,
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

  console.log('📆 Incoming query date:', date);
  console.log('🔐 Token:', req.headers.authorization);

  if (date && !isNaN(new Date(date))) {
    const selectedDate = new Date(date);
    filter.date = {
      $gte: selectedDate,
      $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
    };
  } else if (date) {
    console.warn('⚠️ Invalid date format in query:', date);
    return res.status(400).json({ message: 'Invalid date format' });
  }

  try {
    const workouts = await Workout.find(filter).populate('createdBy', 'name');
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Workout
exports.deleteWorkout = async (req, res) => {
  try {
    const deletedWorkout = await Workout.findByIdAndDelete(req.params.id);
    if (!deletedWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting workout', error: err.message });
  }
};

// List Workouts within a range
exports.listWorkoutsInRange = async (req, res) => {
  const { from, to } = req.query;
  const user = req.user;

  if (!from || !to) {
    return res.status(400).json({ message: 'Both from and to dates are required.' });
  }

  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // include entire day

    let visibleToDate = toDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const settings = await Settings.findOne();
    const releaseTimeStr = settings?.releaseTime || '21:00';
    const [releaseHour, releaseMinute] = releaseTimeStr.split(':').map(Number);

    const releaseDateTime = new Date(today);
    releaseDateTime.setHours(releaseHour, releaseMinute, 0, 0);

    if (user.role !== 'superadmin') {
      const now = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (now >= releaseDateTime) {
        visibleToDate = new Date(tomorrow);
        visibleToDate.setHours(23, 59, 59, 999);
      } else {
        visibleToDate = today;
        visibleToDate.setHours(23, 59, 59, 999);
      }
    }

    const workouts = await Workout.find({
      date: { $gte: fromDate, $lte: visibleToDate }
    }).populate('createdBy', 'name');

    res.json(workouts);
  } catch (err) {
    console.error('❌ Error in range fetch:', err);
    res.status(500).json({ message: 'Error fetching workouts in range' });
  }
};

