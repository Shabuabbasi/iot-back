import express from "express";
import { getCollectors } from "../controllers/userController.js";

const router = express.Router();

router.get("/collectors", getCollectors);

export default router;
