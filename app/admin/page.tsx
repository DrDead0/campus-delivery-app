import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";
import Link from "next/link";
import dbConnect from "@/app/db";
import Product from "@/app/models/product.model";
import VendingMachine from "@/app/models/vendingMachine.model";
import Event from "@/app/models/events.model";
import { AutoRefresh } from "@/components/auto-refresh";
import {
  getAdminStats,
  getAllOrdersForAdmin,
} from "@/app/actions/order-actions";
import { AdminOrderStats } from "@/components/admin-order-stats";
import { AdminAllOrders } from "@/components/admin-all-orders";
import { AdminOrdersManagement } from "@/components/admin-orders-management";
import { ModeToggle } from "@/components/mode-toggle";
import { AdminUserEmailDialog } from "@/components/admin-user-email-dialog";

async function getAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}

export default async function AdminDashboard() {
  // Force rebuild to fix hydration
  const isAuthed = await getAuth();
  if (!isAuthed) redirect("/admin/login");

  let orderStats = { storeStats: [], vendingStats: [] };
  let allOrders: any[] = [];

  try {
    const conn = await dbConnect();
    // ... products count etc

    // Fetch Order Stats
    try {
      orderStats = await getAdminStats();
      allOrders = await getAllOrdersForAdmin();
    } catch (e) {
      console.error("Failed to fetch order stats", e);
    }

    // ... existing counts logic
    // ... existing counts logic
    const dbProductsCount = conn ? await Product.countDocuments() : 0;
    const dbEventsCount = conn ? await Event.countDocuments() : 0;
    // ...
    const vendingMachinesData = conn
      ? await VendingMachine.find({}).lean()
      : [];

    // ...

    const stats = {
      deliveryItems: dbProductsCount, // Use DB Products count instead of static list
      events: dbEventsCount,
      vending: vendingMachinesData.length,
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

        {/* Recent Orders Management Section */}
        <AdminOrdersManagement orders={allOrders} />

        {/* Order Stats Section */}
        <AdminOrderStats stats={orderStats} />

        {/* All Orders Table */}
        <AdminAllOrders orders={allOrders} />

        {/* Quick Commands */}
        <Card>
          {/* ... Keep Quick Commands ... */}
          <CardHeader>
            <CardTitle>Quick Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 mb-4">{/* Sync buttons removed */}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              {/* Email Users Button */}
              <AdminUserEmailDialog />
            </div>
            <Button variant="outline" asChild className="w-full rounded-lg">
              <Link href="/">View app homepage</Link>
            </Button>
          </CardContent>
        </Card>
        <AutoRefresh intervalMs={30000} />
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
