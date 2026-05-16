import mongoose from "mongoose";

const supportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["open", "in-progress", "resolved"], 
    default: "open" 
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high"], 
    default: "medium" 
  },
  createdAt: { type: Date, default: Date.now }
});

const Support = mongoose.model("Support", supportSchema);
export default Support;
