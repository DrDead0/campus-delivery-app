import mongoose, { Schema } from "mongoose";
import { storeItemSchema } from "./storeItem.model.js";

const storeSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["veg", "non-veg"],
      default: "veg",
    },
    items: { type: [storeItemSchema], default: [] },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    items: [storeItemSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model("Store", storeSchema);
