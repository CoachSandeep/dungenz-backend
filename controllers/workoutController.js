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
exports.listWorkoutsInRange = async (req, res) => {
  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Fetch release time
    const settings = await Settings.findOne({});
    const releaseTime = settings?.releaseTime || "21:00";
    const [releaseHour, releaseMinute] = releaseTime.split(":").map(Number);

    const releaseDateTime = new Date(today);
    releaseDateTime.setHours(releaseHour, releaseMinute, 0, 0);

    console.log("🕘 NOW:", now.toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }));
    console.log("🕘 RELEASE:", releaseDateTime.toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }));

    // Past 6 + today
    const datesToInclude = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      datesToInclude.push(date.toISOString().split("T")[0]);
    }

    // Add tomorrow if release time passed
    if (now >= releaseDateTime) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      datesToInclude.push(tomorrow.toISOString().split("T")[0]);
      console.log("✅ Tomorrow included:", tomorrow.toISOString().split("T")[0]);
    }

    // Fetch
    const workouts = await Workout.find({
      date: { $in: datesToInclude }
    }).populate("createdBy", "name");

    console.log("📅 Dates to send:", datesToInclude);
    res.json(workouts);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Workout fetch failed" });
  }
};


// List Workouts within a range
exports.listWorkoutsInRange = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();

    // 🔧 Fetch settings
    const settings = await Settings.findOne({});
    if (!settings || !settings.releaseTime) {
      return res.status(500).json({ message: "Release time not set" });
    }

    const [releaseHour, releaseMinute] = settings.releaseTime.split(":").map(Number);
    const releaseDateTime = new Date(today);
    releaseDateTime.setHours(releaseHour, releaseMinute, 0, 0);

    console.log("🕘 Now:", now.toISOString());
    console.log("🕘 ReleaseTime:", releaseDateTime.toISOString());

    const datesToInclude = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      datesToInclude.push(date.toISOString().split("T")[0]);
    }

    // ✅ Fix: Include tomorrow if release time crossed
    if (now.getTime() >= releaseDateTime.getTime()) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowKey = tomorrow.toISOString().split("T")[0];
      datesToInclude.push(tomorrowKey);
      console.log("✅ Tomorrow Included:", tomorrowKey);
    }

    const workouts = await Workout.find({
      date: { $in: datesToInclude }
    }).populate("createdBy", "name");

    console.log("📅 Final dates:", datesToInclude);
    res.json(workouts);
  } catch (err) {
    console.error("❌ Workout fetch error:", err);
    res.status(500).json({ message: "Workout fetch failed" });
  }
};

