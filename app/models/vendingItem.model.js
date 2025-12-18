import mongoose, { Schema } from "mongoose";
import { productSchema } from "./product.model.js";

const vendingItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: false,
    },
    quantity: {
      type: Number,
      default: 0,
      required: true,
    },
    emoji: {
      type: String,
      default: "🛍️",
    },
    products: [productSchema],
  },
  { timestamps: true }
);

export { vendingItemSchema };

export default mongoose.models.vendingItem ||
  mongoose.model("vendingItem", vendingItemSchema);
