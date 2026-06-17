import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const buildAuthUser = (user) => ({
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

// REGISTER
export const register = async (req, res) => {
    try {

        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "collector"
        });

        res.status(201).json({
            message: "User registered successfully",
            user: buildAuthUser(user)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// LOGIN
export const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: buildAuthUser(user)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// logout
export const logout = (req, res ) => {

}
