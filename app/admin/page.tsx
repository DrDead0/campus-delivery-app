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
import { AutoRefresh } from "@/components/auto-refresh";
import { getAdminStats } from "@/app/actions/order-actions";
import { AdminOrderStats } from "@/components/admin-order-stats";
import { ModeToggle } from "@/components/mode-toggle";

async function getAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}

export default async function AdminDashboard() {
  const isAuthed = await getAuth();
  if (!isAuthed) redirect("/admin/login");

  let orderStats = { storeStats: [], vendingStats: [] };

  try {
    const conn = await dbConnect();
    // ... products count etc

    // Fetch Order Stats
    try {
      orderStats = await getAdminStats();
    } catch (e) {
      console.error("Failed to fetch order stats", e);
    }

    // ... existing counts logic
    const dbProductsCount = conn ? await Product.countDocuments() : 0;
    const dbEventsCount = conn ? await Event.countDocuments() : 0;
    // ...
    const vendingMachinesData = conn
      ? await VendingMachine.find({}).lean()
      : [];

    // ...

    const stats = {
      deliveryItems: deliveryItems.length,
      events: dbEventsCount,
      vending: vendingMachinesData.length || vendingMachines.length,
      dbProducts: dbProductsCount,
    };

    return (
      <div className="min-h-screen px-4 py-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <form action={logoutAction}>
              <Button variant="secondary">Logout</Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* ... Keep Data Stats Cards ... */}
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

        {/* Order Stats Section */}
        <AdminOrderStats stats={orderStats} />

        {/* Quick Commands */}
        <Card>
          {/* ... Keep Quick Commands ... */}
          <CardHeader>
            <CardTitle>Quick Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* ... */}
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
              <Button variant="default" asChild className="rounded-lg">
                <Link href="/admin/vending-machines">
                  Manage vending machines
                </Link>
              </Button>
            </div>
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
