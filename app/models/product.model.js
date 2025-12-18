import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    Description: { type: String, required: true },
    price: { type: Number, required: true },
    availability: {
      type: String,
      enum: ["inStock", "outOfStock"],
      default: "inStock",
      required: true,
    },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

// Avoid OverwriteModelError in dev/HMR by reusing compiled model
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export { productSchema };
export default Product;
