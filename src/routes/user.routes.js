import express from "express";
import { getCollectors, getMyProfile, updateMyProfile } from "../controllers/userController.js";
import profileUpload from "../middlewares/profileUploadMiddleware.js";

const router = express.Router();

router.get("/me", getMyProfile);
router.put("/me", profileUpload.single("profilePic"), updateMyProfile);
router.get("/collectors", getCollectors);

export default router;
