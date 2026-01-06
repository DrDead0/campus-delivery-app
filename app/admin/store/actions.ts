"use server";

import { cookies } from "next/headers";
import dbConnect from "@/app/db";
import Store from "@/app/models/store.model";
import VendingMachine from "@/app/models/vendingMachine.model";
import bcrypt from "bcryptjs";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { ok: false, error: "Missing credentials" };
  }

  try {
    const conn = await dbConnect();
    if (!conn) return { ok: false, error: "Database not configured." };

    // Check Stores
    const store = await Store.findOne({ username });
    if (store) {
      const isValid = await bcrypt.compare(password, store.password);
      if (isValid) {

        const cookieStore = await cookies();
        cookieStore.set(
          "store_owner_auth",
          JSON.stringify({ id: store.id, type: "store", dbId: store._id }),
          {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 8,
          }
        );
        return { ok: true };
      }

    }

    // Check Vending Machines
    const vm = await VendingMachine.findOne({ username });
    if (vm) {
      const isValid = await bcrypt.compare(password, vm.password);
      if (isValid) {

        const cookieStore = await cookies();
        cookieStore.set(
          "store_owner_auth",
          JSON.stringify({ id: vm.id, type: "vending", dbId: vm._id }),
          {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 8,
          }
        );
        return { ok: true };
      }

    }

    return { ok: false, error: "Invalid credentials" };
  } catch (err) {
    console.error("Store login error:", err);
    return { ok: false, error: "Login failed" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("store_owner_auth");
}
