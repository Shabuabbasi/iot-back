import Attendance from "../models/attendanceModel.js";

// CHECK-IN
export const checkIn = async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // Check if already checked in today
    const existing = await Attendance.findOne({ userId, date });
    if (existing) {
      return res.status(400).json({ message: "You have already checked in today." });
    }

    // Determine status (Shift starts at 9:00 AM)
    const shiftStart = new Date(now);
    shiftStart.setHours(9, 0, 0, 0);
    
    let status = "present";
    if (now > shiftStart) {
      status = "late";
    }

    const attendance = await Attendance.create({
      userId,
      date,
      checkInTime: now,
      status,
      location: { lat, lng }
    });

    // Emit socket event for real-time admin update
    const io = req.app.get("io");
    if (io) {
      io.emit("attendanceUpdate", {
        userId,
        status,
        checkInTime: now
      });
    }

    res.status(201).json({ message: "Checked in successfully", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ATTENDANCE HISTORY
export const getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await Attendance.find({ userId }).sort({ date: -1 });
    
    // Calculate stats
    const stats = {
      present: history.filter(h => h.status === "present").length,
      late: history.filter(h => h.status === "late").length,
      absent: history.filter(h => h.status === "absent").length,
      halfDay: history.filter(h => h.status === "half-day").length,
      rate: history.length > 0 ? Math.round((history.filter(h => h.status !== "absent").length / 30) * 100) : 0
    };

    res.status(200).json({ history, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET STATUS FOR TODAY
export const getTodayStatus = async (req, res) => {
    try {
      const { userId } = req.params;
      const date = new Date().toISOString().split("T")[0];
      const attendance = await Attendance.findOne({ userId, date });
      res.status(200).json({ checkedIn: !!attendance, attendance });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

// GET ALL ATTENDANCE (Admin)
export const getAllAttendance = async (req, res) => {
  try {
    const history = await Attendance.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
