import mongoose, { Schema } from "mongoose";

const storeItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // Allow overriding price/availability per store if needed,
    // otherwise fallback to Product via populate
    price: {
      type: Number,
      required: false,
    },
    availability: {
      type: String,
      enum: ["inStock", "outOfStock"],
      default: "inStock",
    },
  },
  { timestamps: true }
);

export { storeItemSchema };
