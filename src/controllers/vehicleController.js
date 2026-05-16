import Vehicle from "../models/vehicleModel.js";

// Create Vehicle
export const addVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ message: "Vehicle added successfully", vehicle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("assignedCollector", "name email");
    res.status(200).json({ vehicles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Vehicle
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "Vehicle updated", vehicle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Vehicle
export const deleteVehicle = async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
