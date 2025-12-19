import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  logoutAction,
  syncEventsAction,
  syncVendingMachinesAction,
} from "./actions";
import Link from "next/link";
import { deliveryItems, events, vendingMachines } from "@/lib/data";
import dbConnect from "@/app/db";
import Product from "@/app/models/product.model";
import VendingMachine from "@/app/models/vendingMachine.model";
import Event from "@/app/models/events.model";
import { VendingMachinesClient } from "./vending-machines-client";
import { VendingSyncClient } from "./vending-sync-client";
import { AutoRefresh } from "@/components/auto-refresh";

async function getAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}

export default async function AdminDashboard() {
  const isAuthed = await getAuth();
  if (!isAuthed) redirect("/admin/login");

  try {
    const conn = await dbConnect();
    const dbProductsCount = conn ? await Product.countDocuments() : 0;
    const dbEventsCount = conn ? await Event.countDocuments() : 0;
    const vendingMachinesData = conn
      ? await VendingMachine.find({})
          .populate({
            path: "items",
            populate: {
              path: "productId",
            },
          })
          .lean()
      : [];
    const productsData = conn ? await Product.find({}).lean() : [];

    // Convert MongoDB objects to plain JS objects
    const plainVendingMachines = JSON.parse(
      JSON.stringify(vendingMachinesData)
    );
    const plainProducts = JSON.parse(JSON.stringify(productsData));

    const stats = {
      deliveryItems: deliveryItems.length,
      events: dbEventsCount,
      vending: plainVendingMachines.length || vendingMachines.length,
      dbProducts: dbProductsCount,
    };

    return (
      <div className="min-h-screen px-4 py-6 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <form action={logoutAction}>
            <Button variant="secondary">Logout</Button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.dbProducts}</p>
              <p className="text-muted-foreground">Items in database</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.events}</p>
              <p className="text-muted-foreground">Upcoming events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vending Machines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.vending}</p>
              <p className="text-muted-foreground">Machines deployed</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              These are basic actions aligned with the app. You can extend them
              to use the database models in <code>app/models</code>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="default" asChild className="rounded-lg">
                <Link href="/admin/products">Manage products</Link>
              </Button>
              <Button variant="default" asChild className="rounded-lg">
                <Link href="/admin/events">Manage events</Link>
              </Button>
              <Button variant="default" asChild className="rounded-lg">
                <Link href="/admin/stores">Manage stores</Link>
              </Button>
              <div>
                <VendingSyncClient />
              </div>
            </div>
            {plainVendingMachines.length > 0 && (
              <div className="pt-2">
                <VendingMachinesClient
                  machines={plainVendingMachines}
                  products={plainProducts}
                />
              </div>
            )}
            <Button variant="outline" asChild className="w-full rounded-lg">
              <Link href="/">View app homepage</Link>
            </Button>
          </CardContent>
        </Card>
        <AutoRefresh />
      </div>
    );
  } catch (err) {
    console.error("AdminDashboard error:", err);
    return (
      <div className="min-h-screen p-4">
        <p className="text-red-600">Failed to load admin dashboard.</p>
      </div>
    );
  }
}
