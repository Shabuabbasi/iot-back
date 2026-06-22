import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

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

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Expiration 10 minutes from now
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = expires;
        await user.save();

        const message = `Your password reset OTP is: ${otp}\nIt will expire in 10 minutes.`;

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #22c55e; padding: 25px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Password Reset</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
                        Hello,
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password. Use the following OTP to securely complete the process:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #22c55e; letter-spacing: 6px; background-color: #f0fdf4; padding: 15px 30px; border-radius: 8px; border: 1px solid #bbf7d0;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
                        This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
                    </p>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        &copy; ${new Date().getFullYear()} Smart Waste Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
        `;

        // Send email
        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset Code - Action Required",
                text: message,
                html: htmlTemplate
            });
            console.log(`OTP for ${email} is: ${otp}`); // For testing without email configuration
            res.status(200).json({ message: "OTP sent to email successfully" });
        } catch (error) {
            user.resetPasswordOtp = null;
            user.resetPasswordExpires = null;
            await user.save();
            return res.status(500).json({ message: error.message || "Email could not be sent." });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.resetPasswordOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.resetPasswordOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        
        // Clear OTP
        user.resetPasswordOtp = null;
        user.resetPasswordExpires = null;
        
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
