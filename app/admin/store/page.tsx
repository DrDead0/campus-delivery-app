import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import dbConnect from "@/app/db";
import Store from "@/app/models/store.model";
import VendingMachine from "@/app/models/vendingMachine.model";
import "@/app/models/product.model"; // Ensure model is registered
import { StoreDashboardClient } from "./client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logoutAction } from "./actions";
import { getStoreOrders } from "@/app/actions/order-actions";
import { ModeToggle } from "@/components/mode-toggle";

export const dynamic = "force-dynamic";

async function getOwnerAuth() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("store_owner_auth");
  if (!authCookie) return null;
  try {
    return JSON.parse(authCookie.value);
  } catch {
    return null;
  }
}

export default async function StoreDashboardPage() {
  const auth = await getOwnerAuth();
  if (!auth) redirect("/admin/store/login");

  const conn = await dbConnect();
  if (!conn) return <div>Database error</div>;

  let data = null;
  // Fetch store or vending machine
  if (auth.type === "store") {
    // Check if dbId is ObjectId or custom id.
    // Auth cookie probably stores _id or custom id.
    // Usually it stores _id. Let's assume _id.
    let store = await Store.findById(auth.dbId)
      .populate("items.productId")
      .lean();
    if (!store) {
      // Fallback to custom id if stored in cookie
      store = await Store.findOne({ id: auth.dbId })
        .populate("items.productId")
        .lean();
    }
    if (store) data = JSON.parse(JSON.stringify(store));
  } else {
    let vm = await VendingMachine.findById(auth.dbId)
      .populate("items.productId")
      .lean();
    if (!vm) {
      vm = await VendingMachine.findOne({ id: auth.dbId })
        .populate("items.productId")
        .lean();
    }
    if (vm) data = JSON.parse(JSON.stringify(vm));
  }

  // If still no data
  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">
          Entity not found. Please contact admin.
        </h1>
        <form action={logoutAction}>
          <Button variant="outline" className="mt-4">
            Logout
          </Button>
        </form>
      </div>
    );
  }

  // Fetch Orders
  // Use data.id (custom ID) or data._id (MongoDB ID) depending on what getStoreOrders expects.
  // Our getStoreOrders handles both now.
  const orders = await getStoreOrders(data.id || data._id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div>
          <h1 className="text-xl font-bold">
            {data.name || data.names || "Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {auth.type === "store" ? "Store Portal" : "Vending Machine Portal"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{data.username}</span>
          <ModeToggle />
          <form action={logoutAction}>
            <Button variant="ghost" size="sm">
              Logout
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <StoreDashboardClient
          data={data}
          type={auth.type}
          initialOrders={orders}
        />
      </main>
    </div>
  );
}
