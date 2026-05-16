import User from "../models/userModel.js";

// @desc    Get all collectors
// @route   GET /api/users/collectors
export const getCollectors = async (req, res) => {
  try {
    const collectors = await User.find({ role: "collector" }).select("-password");
    res.status(200).json({
      count: collectors.length,
      collectors
    });
  } catch (error) {
    console.error("Get Collectors Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
