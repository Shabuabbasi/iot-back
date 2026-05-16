import express from "express";
import { checkIn, getHistory, getTodayStatus, getAllAttendance } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/check-in", checkIn);
router.get("/all", getAllAttendance);
router.get("/history/:userId", getHistory);
router.get("/status/:userId", getTodayStatus);

export default router;
