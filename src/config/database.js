import mongoose from "mongoose";
import dotenv from "dotenv";
const mongooseConnect = () => {
	const uri = process.env.MONGO_URI || process.env.MONGO_URI;
	mongoose
		.connect(uri)
		.then(() => {
			console.log("Connected to MongoDB Successfully...");
		})
		.catch((err) => {
			console.log("Error connecting to MongoDB: ", err);
		});
};

export default mongooseConnect;
