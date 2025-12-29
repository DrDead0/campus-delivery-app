import mongoose, { Schema } from "mongoose";
import { vendingItemSchema } from "./vendingItem.model.js";

const vendingMachineSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    names: {
      type: String,
      required: true,
    },
    building: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    hostel: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["veg", "non-veg", "both"],
      default: "both",
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    items: [vendingItemSchema],
  },
  { timestamps: true }
);

export default mongoose.models.VendingMachine ||
  mongoose.model("VendingMachine", vendingMachineSchema);
