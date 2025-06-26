const Workout = require('../models/Workout');
const Settings = require('../models/settings');
const MovementVideo = require('../models/MovementVideo');

// Upload a Workout
exports.uploadWorkout = async (req, res) => {
  const { title, description, date, version, capTime, instructions, customName, icon, targetUser, adminNote, movements = [] } = req.body;

  try {
    // ✅ Auto-check and create placeholder videos
    for (const move of movements) {
      const exists = await MovementVideo.findOne({ name: move });
      if (!exists) {
        await MovementVideo.create({ name: move }); // creates a placeholder with just the name
      }
    }

    // ✅ Now create the workout
    const newWorkout = await Workout.create({
      title,
      description,
      date,
      version,
      capTime,
      instructions,
      customName,
      icon,
      createdBy: req.user.id,
      targetUser: targetUser || null,
      movements,
      adminNote
    });

    res.status(201).json(newWorkout);
  } catch (err) {
    console.error("❌ Workout upload failed:", err);
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

    const { from, to, user } = req.query;

    const settings = await Settings.findOne({});
    const releaseTime = settings?.releaseTime || "21:00";
    const [releaseHour, releaseMinute] = releaseTime.split(":").map(Number);
    const releaseDateTime = new Date(today);
    releaseDateTime.setHours(releaseHour, releaseMinute, 0, 0);

    const allowedDates = [];

    if (!from || !to) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        allowedDates.push(d.toISOString().split("T")[0]);
      }

      if (now >= releaseDateTime) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        allowedDates.push(tomorrow.toISOString().split("T")[0]);
      }
    } else {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split("T")[0];
        const dClone = new Date(d);
        dClone.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        if (dClone < today || dClone.getTime() === today.getTime() || 
            (dClone.getTime() === tomorrow.getTime() && now >= releaseDateTime)) {
          allowedDates.push(dateKey);
        }
      }
    }

    let filter = { date: { $in: allowedDates } };

    if (user) {
      filter.$or = [
        { targetUser: user },
        { targetUser: null }
      ];
    } else {
      filter.$or = [
        { targetUser: req.user._id },
        { targetUser: null }
      ];
    }

    const workouts = await Workout.find(filter)
      .populate("createdBy", "name")
      .lean(); // use lean for better performance if no virtuals needed

    const grouped = {};
    for (const w of workouts) {
      const key = w.date.toISOString().split("T")[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(w);
    }

    const result = [];
    for (const date in grouped) {
      const dayWorkouts = grouped[date];
      const personalized = dayWorkouts.filter(w => w.targetUser?.toString() === req.user._id.toString());

      if (personalized.length > 0) {
        result.push(...personalized);
      } else {
        const general = dayWorkouts.filter(w => !w.targetUser);
        result.push(...general);
      }
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching workouts in range:", err);
    res.status(500).json({ message: "Workout fetch failed" });
  }
};


exports.getWorkoutsByMonth = async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ message: "Year and month are required." });
  }

  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  try {
    const workouts = await Workout.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ date: 1 });

    res.json(workouts);
  } catch (err) {
    console.error("❌ Monthly workout fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch workouts", error: err.message });
  }
};
