import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  // Use Google & Cloudflare DNS to resolve MongoDB Atlas SRV records
  // This fixes ECONNREFUSED on networks with restrictive DNS
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Tip: If SRV fails, try using a standard mongodb:// connection string from Atlas.');
    process.exit(1);
  }
};

export default connectDB;