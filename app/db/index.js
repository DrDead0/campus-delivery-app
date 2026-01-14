import mongoose from "mongoose";

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const dbConnect = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (cached.conn) return cached.conn;
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set in process.env");
    console.error("Available environment variables:", Object.keys(process.env));
    return null;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, { bufferCommands: false })
      .then((conn) => {
        console.log("Database Connected");
        return conn;
      });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("Database connection failed:", e);
    throw e;
  }
  return cached.conn;
};

export default dbConnect;
