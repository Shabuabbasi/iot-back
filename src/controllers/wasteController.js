import Waste from "../models/wasteModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine waste status based on distance and max distance
const getWasteStatus = (distance, maxDistance = 30) => {
  const percentage = (distance / maxDistance) * 100;
  if (percentage < 33) return "empty";
  if (percentage < 66) return "half";
  return "full";
};

// Upload waste level and image (handles binary data from ESP32)
export const uploadWasteData = async (req, res) => {
  try {
    console.log("📨 Request received");
    console.log("Content-Type:", req.get('content-type'));
    console.log("Is Buffer:", Buffer.isBuffer(req.body));
    
    // Get data from headers (sent by ESP32)
    const wasteDistance = parseFloat(req.headers["x-waste-distance"]);
    const wasteLevel = parseFloat(req.headers["x-waste-level"]) || null;
    const binId = req.headers["x-bin-id"] || (req.body && req.body.binId);
    const location = req.headers["x-location"] || (req.body && req.body.location);
    const maxDistance = parseFloat(req.headers["x-max-distance"]) || 30;
    const lat = parseFloat(req.headers["x-lat"]) || (req.body && req.body.lat);
    const lng = parseFloat(req.headers["x-lng"]) || (req.body && req.body.lng);

    console.log("✓ Parsed data:", { binId, location, wasteDistance, wasteLevel, lat, lng });

    // Validation
    if (!binId || !location || isNaN(wasteDistance)) {
      return res.status(400).json({
        message: "binId, location, and waste distance (X-Waste-Distance header) are required",
        received: { binId, location, wasteDistance }
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "../../uploads/waste");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Calculate waste level as percentage
    const calculatedWasteLevel = Math.min((wasteDistance / maxDistance) * 100, 100);
    const finalWasteLevel = wasteLevel !== null ? Math.round(wasteLevel) : Math.round(calculatedWasteLevel);
    const status = getWasteStatus(wasteDistance, maxDistance);

    // Prepare update object
    const updateData = {
      location,
      distance: wasteDistance,
      wasteLevel: finalWasteLevel,
      status,
      lat: !isNaN(lat) ? lat : undefined,
      lng: !isNaN(lng) ? lng : undefined
    };

    // Handle image upload
    if (req.file) {
      // Image uploaded via multipart form (from web)
      updateData.imagePath = req.file.path;
      updateData.imageUrl = `/uploads/waste/${req.file.filename}`;
      console.log("✓ Image from multer:", updateData.imageUrl);
    } else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      // Handle raw binary data sent from ESP32
      const timestamp = Date.now();
      const filename = `${binId}-${timestamp}.jpg`;
      const filepath = path.join(uploadsDir, filename);

      console.log(`📸 Saving image: ${filename} (${req.body.length} bytes)`);

      try {
        fs.writeFileSync(filepath, req.body);
        updateData.imagePath = filepath;
        updateData.imageUrl = `/uploads/waste/${filename}`;
        console.log("✅ Image saved successfully");
      } catch (err) {
        console.error("❌ Error saving image:", err);
      }
    } else {
      console.warn("⚠️ No image data received for bin:", binId);
    }

    // Add IP address
    updateData.ipAddress = req.ip || req.connection.remoteAddress;

    // Update or create waste record
    const waste = await Waste.findOneAndUpdate(
      { binId },
      updateData,
      { new: true, upsert: true }
    );

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("binUpdate", waste);
      if (waste.status === "full") {
        io.emit("binFull", {
          binId: waste.binId,
          location: waste.location,
          wasteLevel: waste.wasteLevel
        });
      }
    }

    res.status(200).json({
      message: "Waste data uploaded successfully",
      data: {
        binId: waste.binId,
        location: waste.location,
        distance: waste.distance,
        wasteLevel: waste.wasteLevel,
        status: waste.status,
        imageUrl: waste.imageUrl,
        lat: waste.lat,
        lng: waste.lng,
        lastUpdated: waste.updatedAt
      }
    });
  } catch (error) {
    console.error("Error uploading waste data:", error);
    res.status(500).json({
      message: "Error uploading waste data",
      error: error.message
    });
  }
};

// Get all waste data
export const getAllWaste = async (req, res) => {
  try {
    const wasteData = await Waste.find().sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Waste data retrieved successfully",
      count: wasteData.length,
      data: wasteData
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving waste data",
      error: error.message
    });
  }
};

// Get waste data by bin ID
export const getWasteByBinId = async (req, res) => {
  try {
    const { binId } = req.params;

    const waste = await Waste.findOne({ binId });

    if (!waste) {
      return res.status(404).json({
        message: "Waste record not found"
      });
    }

    res.status(200).json({
      message: "Waste data retrieved successfully",
      data: waste
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving waste data",
      error: error.message
    });
  }
};

// Get waste statistics
export const getWasteStats = async (req, res) => {
  try {
    const stats = await Waste.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgLevel: { $avg: "$wasteLevel" }
        }
      }
    ]);

    const totalBins = await Waste.countDocuments();

    res.status(200).json({
      message: "Waste statistics retrieved successfully",
      totalBins,
      stats
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving waste statistics",
      error: error.message
    });
  }
};

// Get bins that need collection (status = full)
export const getFullBins = async (req, res) => {
  try {
    const fullBins = await Waste.find({ status: "full" }).sort({
      updatedAt: -1
    });

    res.status(200).json({
      message: "Full bins retrieved successfully",
      count: fullBins.length,
      data: fullBins
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving full bins",
      error: error.message
    });
  }
};

// Simple endpoint for ultrasonic data (JSON payload from Arduino)
export const uploadUltrasonicData = async (req, res) => {
  try {
    const { binId, level } = req.body;
    
    // Validation
    if (!binId || level === undefined) {
      return res.status(400).json({
        message: "binId and level are required in JSON payload"
      });
    }

    // Convert level to number and validate
    const wasteLevel = parseFloat(level);
    if (isNaN(wasteLevel) || wasteLevel < 0 || wasteLevel > 100) {
      return res.status(400).json({
        message: "level must be a number between 0 and 100"
      });
    }

    // Calculate distance based on level (assuming max distance 30cm)
    const maxDistance = 30;
    const distance = maxDistance - (wasteLevel / 100) * maxDistance;
    
    // Determine status based on level
    let status;
    if (wasteLevel < 33) status = "empty";
    else if (wasteLevel < 66) status = "half";
    else status = "full";

    // Default location for test
    const location = "Test_Location";

    // Prepare update data
    const updateData = {
      binId,
      location,
      wasteLevel,
      distance,
      status,
      ipAddress: req.ip || req.connection.remoteAddress
    };

    // Update or create waste record
    const waste = await Waste.findOneAndUpdate(
      { binId },
      updateData,
      { new: true, upsert: true }
    );

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("binUpdate", waste);
    }

    res.status(200).json({
      message: "Ultrasonic data received successfully",
      data: {
        binId: waste.binId,
        level: waste.wasteLevel,
        distance: waste.distance,
        status: waste.status,
        location: waste.location,
        timestamp: waste.updatedAt
      }
    });
  } catch (error) {
    console.error("Error processing ultrasonic data:", error);
    res.status(500).json({
      message: "Error processing ultrasonic data",
      error: error.message
    });
  }
};

// Heartbeat endpoint to monitor if ESP32 is online
export const logHeartbeat = async (req, res) => {
  try {
    const { binId, distance } = req.body;
    
    if (!binId) {
      return res.status(400).json({ message: "binId is required" });
    }

    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n======================================================`);
    console.log(`🟢 [${timestamp}] ESP32 ONLINE!`);
    console.log(`📡 Bin ID: ${binId}`);
    if (distance !== undefined) {
      console.log(`📏 Current Distance: ${distance} cm`);
    }
    console.log(`======================================================\n`);

    res.status(200).json({ message: "Heartbeat received" });
  } catch (error) {
    console.error("Heartbeat error:", error);
    res.status(500).json({ message: "Heartbeat error" });
  }
};
