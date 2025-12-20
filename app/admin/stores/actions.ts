"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/app/db";
import Store from "@/app/models/store.model";
import bcrypt from "bcryptjs";

import Product from "@/app/models/product.model";
import Cart from "@/app/models/cart.model";

export async function createStoreAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const type = String(formData.get("type") || "non-veg"); // Default to non-veg matches UI
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const email = String(formData.get("email") || "").trim();

    if (!id || !name || !description || !username || !password || !email)
      return { ok: false, error: "All fields are required." };

    // Check uniqueness
    const existing = await Store.findOne({
      $or: [{ id }, { username }, { email }],
    });
    if (existing)
      return { ok: false, error: "Store ID, Username or Email already exists." };

    const hashedPassword = await bcrypt.hash(password, 10);

    await Store.create({
      id,
      name,
      description,
      type, // Pass type
      username,
      password: hashedPassword,
      items: [],
      image: "/placeholder-logo.png", // Default image
      location: "Active Campus", // Default location
      phoneNumber,
      email,
    });

    revalidatePath("/admin/stores");
    revalidatePath("/api/stores");
    return { ok: true };
  } catch (err) {
    console.error("createStoreAction error:", err);
    return { ok: false, error: "Failed to create store." };
  }
}

export async function updateStoreAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const originalId = String(formData.get("originalId") || "");
    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const type = String(formData.get("type") || "non-veg");
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const email = String(formData.get("email") || "").trim();

    if (!originalId) return { ok: false, error: "Missing original store id." };

    const updateData: any = { id, name, description, type, username, phoneNumber, email };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await Store.findOneAndUpdate(
      { id: originalId }, // usage of custom ID
      updateData,
      { new: true }
    );

    revalidatePath("/admin/stores");
    revalidatePath("/api/stores");
    return { ok: true };
  } catch (err) {
    console.error("updateStoreAction error:", err);
    return { ok: false, error: "Failed to update store." };
  }
}

export async function deleteStoreAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const id = String(formData.get("id") || "");
    if (!id) return { ok: false, error: "Missing store id." };

    const store = await Store.findOne({ id });
    if (store) {
      // Cleanup products
      await Product.deleteMany({ store: store._id });

      // Cleanup carts: remove items where sourceId matches this store
      // Note: store._id is ObjectId, items.sourceId in Cart is ObjectId.
      // But let's be careful about type matching. sourceId in Cart is ObjectId.
      await Cart.updateMany(
        { "items.sourceId": store._id },
        { $pull: { items: { sourceId: store._id } } }
      );

      // Delete store
      await Store.findByIdAndDelete(store._id);
    } else {
      // Try checking if it was passed as _id? 
      // But UI sends custom ID usually.
    }

    revalidatePath("/admin/stores");
    revalidatePath("/api/stores");
    return { ok: true };
  } catch (err) {
    console.error("deleteStoreAction error:", err);
    return { ok: false, error: "Failed to delete store." };
  }
}
