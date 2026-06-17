import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const profileFields = [
  "name",
  "email",
  "phone",
  "dob",
  "education",
  "department",
  "position",
  "experience",
  "address"
];

const normalizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  dob: user.dob || "",
  education: user.education || "",
  department: user.department || "",
  position: user.position || "",
  experience: user.experience || "",
  address: user.address || "",
  profilePic: user.profilePic || ""
});

const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.id;
};

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

// @desc    Get logged-in user's profile
// @route   GET /api/users/me
export const getMyProfile = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: normalizeUser(user) });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(401).json({ message: "Not authorized", error: error.message });
  }
};

// @desc    Update logged-in user's profile
// @route   PUT /api/users/me
export const updateMyProfile = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const updates = {};
    profileFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (updates.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    if (req.file) {
      updates.profilePic = `/uploads/profile/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: normalizeUser(user)
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
