import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import dbConnect from "@/app/db";
import Product from "@/app/models/product.model";

import VendingMachine from "@/app/models/vendingMachine.model";
import Store from "@/app/models/store.model";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProductsListClient } from "./client";
import { AutoRefresh } from "@/components/auto-refresh";

async function getAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}

export default async function ProductsAdminPage() {
  const isAuthed = await getAuth();
  if (!isAuthed) redirect("/admin/login");

  try {
    const conn = await dbConnect();
    if (!conn) {
      return (
        <div className="min-h-screen p-4 max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products Admin</CardTitle>
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
    const products = await Product.find({}).lean();
    const machines = await VendingMachine.find({})
      .populate({
        path: "items",
        populate: {
          path: "productId",
        },
      })
      .lean();
    const stores = await Store.find({}).lean();
    // Serialize Mongoose objects to plain JSON for client component
    const serialized = JSON.parse(JSON.stringify(products));
    const serializedMachines = JSON.parse(JSON.stringify(machines));
    const serializedStores = JSON.parse(JSON.stringify(stores));

    return (
      <div className="min-h-screen p-4 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Products</h1>
          <Button variant="outline" asChild>
            <Link href="/admin">Back</Link>
          </Button>
        </div>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsListClient
              products={serialized}
              machines={serializedMachines}
              stores={serializedStores}
            />
          </CardContent>
        </Card>
        <AutoRefresh />
      </div>
    );
  } catch (err) {
    console.error("ProductsAdminPage error:", err);
    return (
      <div className="min-h-screen p-4">
        <p className="text-red-600">Failed to load products.</p>
      </div>
    );
  }
}
