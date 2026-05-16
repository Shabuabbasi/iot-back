import mongoose from "mongoose";

const wasteSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true,
      unique: true
    },
    location: {
      type: String,
      required: true
    },
    wasteLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    distance: {
      type: Number,
      required: true,
      description: "Distance in cm from ultrasonic sensor"
    },
    imageUrl: {
      type: String,
      default: null
    },
    imagePath: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["empty", "half", "full"],
      default: "empty"
    },
    ipAddress: {
      type: String,
      default: null
    },
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Waste", wasteSchema);
