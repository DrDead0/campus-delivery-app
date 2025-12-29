"use server";

import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  const ENV_USER = process.env.ADMIN_USERNAME || "";
  const ENV_PASS = process.env.ADMIN_PASSWORD || "";

  if (username === ENV_USER && password === ENV_PASS) {
    const cookieStore = await cookies();
    cookieStore.set("admin_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 4, // 4 hours
    });
    return { ok: true };
  }
  return { ok: false, error: "Invalid credentials" };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_auth");
}

// --- App-aligned admin commands ---
import dbConnect from "@/app/db";
import Product from "@/app/models/product.model";
import EventModel from "@/app/models/events.model";
import VendingMachine from "@/app/models/vendingMachine.model";

// Sync actions removed as we now use DB directly for creating/managing these entities.
