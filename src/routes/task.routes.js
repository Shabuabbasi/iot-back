import express from "express";
import {
  assignTask,
  getAllTasks,
  getCollectorTasks,
  completeTask
} from "../controllers/taskController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/assign", assignTask);
router.get("/", getAllTasks);
router.get("/collector/:collectorId", getCollectorTasks);

// Use multer upload middleware to handle the completed image
router.put("/:id/complete", upload.single("image"), completeTask);

export default router;
