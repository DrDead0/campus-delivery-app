import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import dbConnect from "@/app/db";
import Store from "@/app/models/store.model";
import "@/app/models/product.model"; // Ensure Product model is registered
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StoresListClient } from "./client";
import { AutoRefresh } from "@/components/auto-refresh";

async function getAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}

export default async function StoresAdminPage() {
  const isAuthed = await getAuth();
  if (!isAuthed) redirect("/admin/login");

  try {
    const conn = await dbConnect();
    if (!conn) {
      return (
        <div className="min-h-screen p-4 max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stores Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">
                Database not configured. Set MONGO_URI in .env.local.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const stores = await Store.find({})
      .populate({ path: "items.productId", model: "Product" })
      .lean();
    const serialized = JSON.parse(JSON.stringify(stores));

    return (
      <div className="min-h-screen p-4 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Stores</h1>
          <Button variant="outline" asChild>
            <Link href="/admin">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <StoresListClient stores={serialized} />
          </CardContent>
        </Card>

        {/* Display Orders for the first store for demo, or loop? 
           The user wants "respective store admin page". 
           Wait, there isn't a route for individual store admin in this file structure yet, 
           only a list of stores. 
           I should check if `app/admin/stores/[id]` exists. 
           If not, I should probably add orders inside `StoresListClient` (expanded view) 
           or simpler: just show ALL store orders for now or link to details.
           Checking directory list... `app/admin/stores` (2 children).
           Let's check if there is an [id] folder.
           
           If not, I'll create a new page for single store admin details.
        */}

        <AutoRefresh />
      </div>
    );
  } catch (err) {
    console.error("StoresAdminPage error:", err);
    return (
      <div className="min-h-screen p-4">
        <p className="text-red-600">Failed to load stores.</p>
      </div>
    );
  }
}
