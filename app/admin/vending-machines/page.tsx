import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import dbConnect from "@/app/db";
import VendingMachine from "@/app/models/vendingMachine.model";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VendingMachinesListClient } from "./client";

async function getAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}

export default async function VendingMachinesAdminPage() {
  const isAuthed = await getAuth();
  if (!isAuthed) redirect("/admin/login");

  try {
    const conn = await dbConnect();
    if (!conn) {
      return (
        <div className="min-h-screen p-4 max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vending Admin</CardTitle>
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

    const machines = await VendingMachine.find({}).lean();
    console.log("Fetched machines:", JSON.stringify(machines, null, 2)); // Debug logging
    const serialized = JSON.parse(JSON.stringify(machines));

    return (
      <div className="min-h-screen p-4 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Vending Machines</h1>
          <Button variant="outline" asChild>
            <Link href="/admin">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <VendingMachinesListClient machines={serialized} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (err) {
    console.error("VendingMachinesAdminPage error:", err);
    return (
      <div className="min-h-screen p-4">
        <p className="text-red-600">Failed to load machines.</p>
      </div>
    );
  }
}
