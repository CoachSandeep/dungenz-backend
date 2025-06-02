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
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const { from, to } = req.query;
    const isSuperAdmin = req.user?.role === "superadmin";

    // Get release time
    const settings = await Settings.findOne({});
    const releaseTime = settings?.releaseTime || "21:00";
    const [releaseHour, releaseMinute] = releaseTime.split(":").map(Number);
    const releaseDateTime = new Date(today);
    releaseDateTime.setHours(releaseHour, releaseMinute, 0, 0);

    // 🎯 Default case: no from/to provided → last 6 + today + tomorrow (if passed)
    if (!from || !to) {
      const datesToInclude = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        datesToInclude.push(d.toISOString().split("T")[0]);
      }

      if (now >= releaseDateTime || isSuperAdmin) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        datesToInclude.push(tomorrow.toISOString().split("T")[0]);
      }

      const workouts = await Workout.find({ date: { $in: datesToInclude } }).populate("createdBy", "name");
      return res.json(workouts);
    }

    // 👇 If custom range is requested (scroll/load more)
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Superadmin → show full range
    if (isSuperAdmin) {
      const workouts = await Workout.find({
        date: { $gte: fromDate, $lte: toDate }
      }).populate("createdBy", "name");
      return res.json(workouts);
    }

    // Member → allow up to today (+ tomorrow if released), but nothing beyond
    const allowedDates = [];

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      const dClone = new Date(d);
      dClone.setHours(0, 0, 0, 0);

      // Include date if: it's before today OR it's today OR it's tomorrow after releaseTime
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (dClone < today) {
        allowedDates.push(dateKey);
      } else if (dClone.getTime() === today.getTime()) {
        allowedDates.push(dateKey);
      } else if (dClone.getTime() === tomorrow.getTime() && now >= releaseDateTime) {
        allowedDates.push(dateKey);
      }
    }

    const workouts = await Workout.find({
      date: { $in: allowedDates }
    }).populate("createdBy", "name");

    res.json(workouts);
  } catch (err) {
    console.error("❌ Error fetching workouts in range:", err);
    res.status(500).json({ message: "Workout fetch failed" });
  }
};


