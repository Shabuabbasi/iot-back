import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "On the way", "In Progress", "Completed"],
      default: "Pending"
    },
    completedImageUrl: {
      type: String,
      default: null
    },
    completedImagePath: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
