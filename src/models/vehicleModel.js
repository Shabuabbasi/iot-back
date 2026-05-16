import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  vehicleNumber: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ["Garbage Truck", "Delivery Car", "Rickshaw", "Van"],
    required: true 
  },
  fuelType: { 
    type: String, 
    enum: ["Diesel", "Petrol", "Electric", "Gas"],
    required: true 
  },
  capacity: { type: String }, // e.g. "5 Tons"
  status: { 
    type: String, 
    enum: ["Active", "Stopped", "Idle", "Maintenance"],
    default: "Active" 
  },
  assignedCollector: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  usage: { type: String, default: "0/1000 km" },
  createdAt: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
