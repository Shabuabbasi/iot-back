import mongoose from "mongoose";

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("MONGO_URI:", process.env.MONGO_URI);
		// console.log(" Mongo DB connected successfully");
		return conn;
	} catch (error) {
		console.error(`MongoDB connection error: ${error.message}`);
		process.exit(1);
	}
};

export default connectDB;
