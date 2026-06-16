import Task from "../models/taskModel.js";
import Waste from "../models/wasteModel.js";
import User from "../models/userModel.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import fs from "fs";

// @desc    Assign a task to a collector
// @route   POST /api/tasks/assign
export const assignTask = async (req, res) => {
  try {
    const { binId, collectorId } = req.body;

    if (!binId || !collectorId) {
      return res.status(400).json({ message: "binId and collectorId are required" });
    }

    // Check if bin exists
    const wasteBin = await Waste.findOne({ binId });
    if (!wasteBin) {
      return res.status(404).json({ message: "Bin not found" });
    }

    // Check if collector exists
    const collector = await User.findById(collectorId);
    if (!collector || collector.role !== "collector") {
      return res.status(404).json({ message: "Collector not found" });
    }

    // Check if task already exists for this bin and is not completed
    const existingTask = await Task.findOne({
      binId,
      status: { $in: ["Pending", "On the way", "In Progress"] },
    });

    if (existingTask) {
      return res.status(400).json({ message: "Task for this bin is already assigned and active" });
    }

    const task = new Task({
      binId: wasteBin.binId,
      location: wasteBin.location,
      collectorId: collector._id,
      status: "Pending"
    });

    await task.save();

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("taskAssigned", task);
    }

    res.status(201).json({
      message: "Task assigned successfully",
      task
    });
  } catch (error) {
    console.error("Assign Task Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("collectorId", "name email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Get All Tasks Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get tasks by collector ID
// @route   GET /api/tasks/collector/:collectorId
export const getCollectorTasks = async (req, res) => {
  try {
    const { collectorId } = req.params;

    const tasks = await Task.find({ collectorId })
      .sort({ createdAt: -1 });

    // Fetch bin details for each task (lat, lng, wasteLevel)
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const bin = await Waste.findOne({ binId: task.binId });
        return {
          ...task._doc,
          lat: bin ? bin.lat : null,
          lng: bin ? bin.lng : null,
          level: bin ? `${bin.wasteLevel}%` : 'N/A'
        };
      })
    );

    res.status(200).json({
      count: enrichedTasks.length,
      tasks: enrichedTasks
    });
  } catch (error) {
    console.error("Get Collector Tasks Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Complete a task and upload image
// @route   PUT /api/tasks/:id/complete
export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "Completed") {
      return res.status(400).json({ message: "Task is already completed" });
    }

    let imageUrl = null;
    let imagePath = null;

    if (req.file) {
      if (process.env.NODE_ENV === "production") {
        try {
          const buffer = fs.readFileSync(req.file.path);
          const result = await uploadToCloudinary(buffer);
          imageUrl = result.secure_url;
        } catch (err) {
          console.error("Cloudinary Upload Error:", err);
          return res.status(500).json({ message: "Failed to upload image to Cloudinary" });
        }
      } else {
        imageUrl = `${req.protocol}://${req.get("host")}/uploads/waste/${req.file.filename}`;
        imagePath = req.file.path;
      }
    } else {
       return res.status(400).json({ message: "Please upload an image to complete the task" });
    }

    task.status = "Completed";
    task.completedImageUrl = imageUrl;
    task.completedImagePath = imagePath;
    task.completedAt = new Date();
    await task.save();

    // Optionally reset the bin to empty in the Waste collection
    // This is useful so the bin doesn't show as full on the dashboard until ESP32 updates
    await Waste.findOneAndUpdate(
      { binId: task.binId },
      { 
        status: "empty", 
        wasteLevel: 0,
        distance: 30 // Assuming max distance is 30
      }
    );

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("taskCompleted", task);
      io.emit("binUpdate", { binId: task.binId, status: "empty", wasteLevel: 0 });
    }

    res.status(200).json({
      message: "Task marked as completed",
      task
    });
  } catch (error) {
    console.error("Complete Task Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
