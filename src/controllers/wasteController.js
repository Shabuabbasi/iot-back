import Waste from "../models/wasteModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { sendBinFullAlert } from "../services/emailService.js";

// Cooldown Map: prevents sending duplicate emails within 10 minutes per bin
const emailCooldown = new Map(); // binId -> last alert timestamp
const EMAIL_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Sends a bin-full email alert with cooldown protection.
 * Will not re-send if an alert was already sent within EMAIL_COOLDOWN_MS.
 */
function triggerBinFullEmail(binId, location, wasteLevel) {
  const lastSent = emailCooldown.get(binId);
  const now = Date.now();
  if (lastSent && now - lastSent < EMAIL_COOLDOWN_MS) {
    const remaining = Math.ceil((EMAIL_COOLDOWN_MS - (now - lastSent)) / 60000);
    console.log(`📧 Email cooldown active for bin ${binId} — skipping (${remaining} min left)`);
    return;
  }
  emailCooldown.set(binId, now);
  sendBinFullAlert({ binId, location, wasteLevel }); // fire-and-forget (non-blocking)
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ultrasonic: small distance = more full (sensor at top measures clearance)
function distanceToFillPercent(distance, maxDistance = 30) {
  const fill = ((maxDistance - distance) / maxDistance) * 100;
  return Math.max(0, Math.min(100, Math.round(fill)));
}

function fillPercentToStatus(fillPercent) {
  if (fillPercent < 33) return "empty";
  if (fillPercent < 66) return "half";
  return "full";
}

// Upload waste level and image (handles binary data from ESP32)
export const uploadWasteData = async (req, res) => {
  try {
    console.log("📨 Request received");
    console.log("Content-Type:", req.get('content-type'));
    console.log("Is Buffer:", Buffer.isBuffer(req.body));
    
    // Get data from headers (sent by ESP32)
    const wasteDistance = parseFloat(req.headers["x-waste-distance"]);
    const binId = req.headers["x-bin-id"] || (req.body && req.body.binId);
    const location = req.headers["x-location"] || (req.body && req.body.location);
    const maxDistance = parseFloat(req.headers["x-max-distance"]) || 30;
    const lat = parseFloat(req.headers["x-lat"]) || (req.body && req.body.lat);
    const lng = parseFloat(req.headers["x-lng"]) || (req.body && req.body.lng);

    console.log("✓ Parsed data:", { binId, location, wasteDistance, lat, lng });

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

    // Calculate fill % from clearance: less distance = more full
    const finalWasteLevel = distanceToFillPercent(wasteDistance, maxDistance);
    const status = fillPercentToStatus(finalWasteLevel);

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
    if (process.env.NODE_ENV === "production") {
      try {
        let buffer;
        if (req.file) {
          buffer = fs.readFileSync(req.file.path);
        } else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
          buffer = req.body;
        }

        if (buffer) {
          console.log(`📸 Uploading image to Cloudinary (${buffer.length} bytes)`);
          const result = await uploadToCloudinary(buffer);
          updateData.imageUrl = result.secure_url;
          console.log("✅ Image uploaded to Cloudinary:", result.secure_url);
        } else {
          console.warn("⚠️ No image data received for bin:", binId);
        }
      } catch (err) {
        console.error("❌ Error uploading image to Cloudinary:", err);
      }
    } else {
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
        // 📧 Send email alert to admin
        triggerBinFullEmail(waste.binId, waste.location, waste.wasteLevel);
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

// Register a new bin from admin UI (before ESP32 connects)
export const registerBin = async (req, res) => {
  try {
    const { binId, location, lat, lng } = req.body;

    if (!binId || !location) {
      return res.status(400).json({ message: "binId and location are required" });
    }

    const existing = await Waste.findOne({ binId });
    if (existing) {
      return res.status(409).json({ message: `Bin ${binId} already exists` });
    }

    const waste = await Waste.create({
      binId: binId.trim(),
      location: location.trim(),
      distance: 30,
      wasteLevel: 0,
      status: "empty",
      lat: lat != null && !isNaN(parseFloat(lat)) ? parseFloat(lat) : undefined,
      lng: lng != null && !isNaN(parseFloat(lng)) ? parseFloat(lng) : undefined
    });

    const io = req.app.get("io");
    if (io) io.emit("binUpdate", waste);

    res.status(201).json({ message: "Bin registered successfully", data: waste });
  } catch (error) {
    console.error("Error registering bin:", error);
    res.status(500).json({ message: "Error registering bin", error: error.message });
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
    
    const status = fillPercentToStatus(Math.round(wasteLevel));

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

// Heartbeat endpoint — live level updates without image upload
export const logHeartbeat = async (req, res) => {
  try {
    const { binId, distance, location, maxDistance: maxDistBody } = req.body;
    
    if (!binId) {
      return res.status(400).json({ message: "binId is required" });
    }

    const timestamp = new Date().toLocaleTimeString();
    const maxDistance = parseFloat(maxDistBody) || 30;
    
    console.log(`\n======================================================`);
    console.log(`🟢 [${timestamp}] ESP32 ONLINE!`);
    console.log(`📡 Bin ID: ${binId}`);
    if (distance !== undefined) {
      console.log(`📏 Current Distance: ${distance} cm`);
    }
    console.log(`======================================================\n`);

    let waste = null;
    if (distance !== undefined && !isNaN(parseFloat(distance))) {
      const wasteDistance = parseFloat(distance);
      const wasteLevel = distanceToFillPercent(wasteDistance, maxDistance);
      const status = fillPercentToStatus(wasteLevel);

      const update = {
        $set: { distance: wasteDistance, wasteLevel, status },
        $setOnInsert: { binId }
      };
      if (location?.trim()) {
        update.$set.location = location.trim();
      } else {
        update.$setOnInsert.location = "Unknown";
      }

      waste = await Waste.findOneAndUpdate({ binId }, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("binUpdate", waste);
        if (waste.status === "full") {
          io.emit("binFull", {
            binId: waste.binId,
            location: waste.location,
            wasteLevel: waste.wasteLevel
          });
          // 📧 Send email alert to admin
          triggerBinFullEmail(waste.binId, waste.location, waste.wasteLevel);
        }
      }
    }

    res.status(200).json({
      message: "Heartbeat received",
      ...(waste && {
        data: {
          binId: waste.binId,
          distance: waste.distance,
          wasteLevel: waste.wasteLevel,
          status: waste.status
        }
      })
    });
  } catch (error) {
    console.error("Heartbeat error:", error);
    res.status(500).json({ message: "Heartbeat error" });
  }
};
