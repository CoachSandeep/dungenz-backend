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
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 1: Fetch release time from DB
    const settings = await Settings.findOne({});
    if (!settings || !settings.releaseTime) {
      return res.status(500).json({ message: "Release time is not configured in settings" });
    }

    const [releaseHour, releaseMinute] = settings.releaseTime.split(":").map(Number);
    const releaseDateTime = new Date(today);
    releaseDateTime.setHours(releaseHour, releaseMinute, 0, 0);

    // Step 2: Calculate dates to include: past 6 days + today
    const datesToInclude = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      datesToInclude.push(date.toISOString().split("T")[0]);
    }

    // Step 3: Add tomorrow if release time is passed
    const now = new Date();
    if (now >= releaseDateTime) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      datesToInclude.push(tomorrow.toISOString().split("T")[0]);
    }

    // Step 4: Fetch workouts only for these dates
    const workouts = await Workout.find({
      date: { $in: datesToInclude }
    }).populate("createdBy", "name");

    res.json(workouts);
  } catch (err) {
    console.error("❌ Workout fetch error:", err);
    res.status(500).json({ message: "Workout fetch failed" });
  }
};

