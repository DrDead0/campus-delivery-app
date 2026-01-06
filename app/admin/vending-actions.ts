"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/app/db";
import VendingMachine from "@/app/models/vendingMachine.model";

import bcrypt from "bcryptjs";

export async function createVendingMachineAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const id = String(formData.get("id") || "").trim();
    const names = String(formData.get("names") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const hostel = String(formData.get("hostel") || "").trim();
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const type = String(formData.get("type") || "both").trim();

    const image = String(formData.get("image") || "").trim();

    if (!id || !names || !location || !username || !password)
      return { ok: false, error: "All fields are required." };

    const existing = await VendingMachine.findOne({
      $or: [{ id }, { username }],
    });
    if (existing) return { ok: false, error: "ID or Username already exists." };

    const hashedPassword = await bcrypt.hash(password, 10);

    await VendingMachine.create({
      id,
      names,
      location,
      hostel,
      type, // New field
      username,
      password: hashedPassword,
      image: image || "/placeholder-logo.png",
      building: "Main Block", // Default
      items: [],
    });

    revalidatePath("/admin");
    revalidatePath("/api/vending-machines");
    return { ok: true };
  } catch (err) {
    console.error("createVendingMachineAction error:", err);
    return { ok: false, error: "Failed to create machine." };
  }
}

export async function updateVendingMachineAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const originalId = String(formData.get("originalId") || "");
    const id = String(formData.get("id") || "").trim();
    const names = String(formData.get("names") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const hostel = String(formData.get("hostel") || "").trim();
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const type = String(formData.get("type") || "both").trim();
    const image = String(formData.get("image") || "").trim();

    if (!originalId) return { ok: false, error: "Missing original ID." };



    const updateData: any = {
      id,
      names,
      location,
      hostel,
      type,
      username,
      image,
    }; // Added type and image
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await VendingMachine.findOneAndUpdate({ id: originalId }, updateData, {
      new: true,
    });

    revalidatePath("/admin");
    revalidatePath("/api/vending-machines");
    return { ok: true };
  } catch (err) {
    console.error("updateVendingMachineAction error:", err);
    return { ok: false, error: "Failed to update machine." };
  }
}

export async function restockVendingItemAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };

    const machineId = String(formData.get("machineId") || "").trim();
    const productId = String(formData.get("productId") || "").trim();
    const quantity = Number(formData.get("quantity") || 0);

    if (!machineId || !productId || quantity < 0)
      return { ok: false, error: "Invalid input." };

    const machine = await VendingMachine.findById(machineId);
    if (!machine) return { ok: false, error: "Machine not found." };

    // Find if this product already exists in machine's inventory
    const existingItemIndex = machine.items.findIndex(
      (item: any) => item.productId && item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      machine.items[existingItemIndex].quantity = quantity;
    } else {
      // Add new product to machine inventory
      machine.items.push({
        productId: productId,
        quantity: quantity,
      });
    }

    await machine.save();
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/api/vending-machines");


    return { ok: true };
  } catch (err) {
    console.error("restockVendingItemAction error:", err);
    return { ok: false, error: "Failed to update stock." };
  }
}

export async function deleteVendingMachineAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const id = String(formData.get("id") || "");
    if (!id) return { ok: false, error: "Missing machine id." };

    // We use findOneAndDelete with 'id' because that's our custom unique identifier
    // If you prefer _id, ensure the client passes _id and use findByIdAndDelete
    await VendingMachine.findOneAndDelete({ id });

    revalidatePath("/admin");
    revalidatePath("/admin/vending-machines");
    revalidatePath("/api/vending-machines");
    return { ok: true };
  } catch (err) {
    console.error("deleteVendingMachineAction error:", err);
    return { ok: false, error: "Failed to delete machine." };
  }
}
