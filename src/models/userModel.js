import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["admin", "collector"],
        default: "collector"
    },

    phone: {
        type: String,
        default: ""
    },

    dob: {
        type: String,
        default: ""
    },

    education: {
        type: String,
        default: ""
    },

    department: {
        type: String,
        default: ""
    },

    position: {
        type: String,
        default: ""
    },

    experience: {
        type: String,
        default: ""
    },

    address: {
        type: String,
        default: ""
    },

    profilePic: {
        type: String,
        default: ""
    }
},
{ timestamps: true }
);

export default mongoose.model("User", userSchema);
