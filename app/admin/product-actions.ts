"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/app/db";
import Product from "@/app/models/product.model";
import VendingMachine from "@/app/models/vendingMachine.model";
import Store from "@/app/models/store.model";

export async function createProductAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const name = String(formData.get("name") || "").trim();
    const Description = String(formData.get("Description") || "").trim();
    const price = Number(formData.get("price") || 0);
    const availability = String(formData.get("availability") || "inStock");
    const image = String(formData.get("image") || "").trim();
    const vendingMachines = String(formData.get("vendingMachines") || "")
      .split(",")
      .filter((id) => id.trim());
    const stores = String(formData.get("stores") || "")
      .split(",")
      .filter((id) => id.trim());

    if (!name || !Description || !price || !image)
      return { ok: false, error: "All fields are required." };

    const product = await Product.create({
      name,
      Description,
      price,
      availability,
      image,
    });

    // Add product to selected vending machines
    if (vendingMachines.length > 0) {
      for (const machineId of vendingMachines) {
        const machine = await VendingMachine.findById(machineId);
        if (machine) {
          // Check if product already exists in this machine
          const existingItem = machine.items.find(
            (item: any) =>
              item.productId &&
              item.productId.toString() === product._id.toString()
          );
          if (!existingItem) {
            machine.items.push({
              productId: product._id,
              quantity: 0, // Start with 0 stock, admin can update later
            });
            await machine.save();
          }
        }
      }
    }

    // Add product to selected stores
    if (stores.length > 0) {
      for (const storeId of stores) {
        const store = await Store.findById(storeId);
        if (store) {
          // Check if product already exists in this store
          const existingItem = store.items.find(
            (item: any) =>
              item.productId &&
              item.productId.toString() === product._id.toString()
          );
          if (!existingItem) {
            store.items.push({
              productId: product._id,
              // Store specific defaults
            });
            await store.save();
          }
        }
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/api/products");
    revalidatePath("/api/vending-machines");
    revalidatePath("/api/stores");
    return { ok: true };
  } catch (err) {
    console.error("createProductAction error:", err);
    return { ok: false, error: "Failed to create product." };
  }
}

export async function updateProductAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const Description = String(formData.get("Description") || "").trim();
    const price = Number(formData.get("price") || 0);
    const availability = String(formData.get("availability") || "inStock");
    const image = String(formData.get("image") || "").trim();
    const vendingMachines = String(formData.get("vendingMachines") || "")
      .split(",")
      .filter((id) => id.trim());
    const stores = String(formData.get("stores") || "")
      .split(",")
      .filter((id) => id.trim());

    if (!id) return { ok: false, error: "Missing product id." };
    await Product.findByIdAndUpdate(
      id,
      { name, Description, price, availability, image },
      { new: true }
    );

    // Update product in selected vending machines
    if (vendingMachines.length > 0) {
      for (const machineId of vendingMachines) {
        const machine = await VendingMachine.findById(machineId);
        if (machine) {
          // Check if product already exists in this machine
          const existingItem = machine.items.find(
            (item: any) => item.productId && item.productId.toString() === id
          );
          if (!existingItem) {
            machine.items.push({
              productId: id,
              quantity: 0, // Start with 0 stock, admin can update later
            });
            await machine.save();
          }
        }
      }
    }

    // Update product in selected stores
    if (stores.length > 0) {
      for (const storeId of stores) {
        const store = await Store.findById(storeId);
        if (store) {
          // Check if product already exists in this store
          const existingItem = store.items.find(
            (item: any) => item.productId && item.productId.toString() === id
          );
          if (!existingItem) {
            store.items.push({
              productId: id,
            });
            await store.save();
          }
        }
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/api/products");
    revalidatePath("/api/vending-machines");
    revalidatePath("/api/stores");
    return { ok: true };
  } catch (err) {
    console.error("updateProductAction error:", err);
    return { ok: false, error: "Failed to update product." };
  }
}

export async function deleteProductAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const id = String(formData.get("id") || "");
    if (!id) return { ok: false, error: "Missing product id." };
    await Product.findByIdAndDelete(id);
    revalidatePath("/admin/products");
    revalidatePath("/api/products");
    return { ok: true };
  } catch (err) {
    console.error("deleteProductAction error:", err);
    return { ok: false, error: "Failed to delete product." };
  }
}
