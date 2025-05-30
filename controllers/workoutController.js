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
    const releaseTime = settings?.releaseTime || "21:00"; // default fallback
    const [releaseHour, releaseMinute] = releaseTime.split(":").map(Number);
    const releaseDateTime = new Date(today);
    releaseDateTime.setHours(releaseHour, releaseMinute, 0, 0);

    // Step 2: Calculate past 6 + today
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);

    // Step 3: Check if tomorrow should be shown
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const now = new Date();
    const datesToInclude = [today.toISOString().split("T")[0]];

    for (let i = 1; i <= 6; i++) {
      const past = new Date(today);
      past.setDate(today.getDate() - i);
      datesToInclude.push(past.toISOString().split("T")[0]);
    }

    if (now >= releaseDateTime) {
      datesToInclude.push(tomorrow.toISOString().split("T")[0]);
    }

    // Step 4: Fetch only relevant workouts
    const workouts = await Workout.find({
      date: { $in: datesToInclude }
    }).populate("createdBy", "name");

    res.json(workouts);
  } catch (err) {
    console.error("❌ Workout fetch error:", err);
    res.status(500).json({ message: "Workout fetch failed" });
  }
};

