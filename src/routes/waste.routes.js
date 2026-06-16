import express from "express";
import {
  uploadWasteData,
  getAllWaste,
  getWasteByBinId,
  getWasteStats,
  getFullBins,
  uploadUltrasonicData,
  logHeartbeat,
  registerBin
} from "../controllers/wasteController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Upload waste data with image - handles both multipart form (web) and raw binary (ESP32)
router.post("/upload", (req, res, next) => {
  // If content-type is image, skip multer and go directly to controller
  if (req.is('image/*')) {
    return uploadWasteData(req, res);
  }
  // Otherwise use multer for multipart form data
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    uploadWasteData(req, res);
  });
});

// Simple endpoint for ultrasonic data (JSON payload)
router.post("/", uploadUltrasonicData);

// Heartbeat endpoint
router.post("/heartbeat", logHeartbeat);

// Register bin from admin UI
router.post("/register", registerBin);

// Get all waste data
router.get("/all", getAllWaste);

// Get waste by bin ID
router.get("/bin/:binId", getWasteByBinId);

// Get waste statistics
router.get("/stats", getWasteStats);

// Get bins that are full
router.get("/full-bins", getFullBins);

export default router;
