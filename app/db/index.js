import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  // Fail fast and with a clear message in dev
  console.error("Missing MONGO_URI in environment. Set it in .env.local");
}

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const dbConnect = async () => {
  if (cached.conn) return cached.conn;
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set");
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
