import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error('MongoDB Connection Failed. Please check:');
        console.error('1. Your internet connection');
        console.error('2. MongoDB Atlas IP whitelist settings');
        console.error('3. Your connection string in .env file');
        process.exit(1);
    }
};

export default connectDB;
