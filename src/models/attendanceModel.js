import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: String, // Format: YYYY-MM-DD for easy querying
      required: true
    },
    checkInTime: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["present", "late", "half-day", "absent"],
      default: "present"
    },
    location: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

// Ensure a user can only check in once per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
