"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/app/db";
import Store from "@/app/models/store.model";

export async function createStoreAction(formData: FormData) {
  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };
    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!id || !name || !description)
      return { ok: false, error: "All fields are required." };

    await Store.create({
      id,
      name,
      description,
      items: [],
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

    if (!originalId) return { ok: false, error: "Missing original store id." };

    await Store.findOneAndUpdate(
      { id: originalId }, // usage of custom ID
      { id, name, description },
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
    await Store.findOneAndDelete({ id }); // usage of custom ID
    revalidatePath("/admin/stores");
    revalidatePath("/api/stores");
    return { ok: true };
  } catch (err) {
    console.error("deleteStoreAction error:", err);
    return { ok: false, error: "Failed to delete store." };
  }
}
