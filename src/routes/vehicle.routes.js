import express from "express";
import { addVehicle, getAllVehicles, updateVehicle, deleteVehicle } from "../controllers/vehicleController.js";

const router = express.Router();

router.post("/add", addVehicle);
router.get("/all", getAllVehicles);
router.patch("/update/:id", updateVehicle);
router.delete("/delete/:id", deleteVehicle);

export default router;
