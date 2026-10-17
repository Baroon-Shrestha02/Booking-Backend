import mongoose from "mongoose";
import env from "./env.js";

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected Successfully");
  return mongoose.connection;
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

export const isDatabaseReady = () => mongoose.connection.readyState === 1;
