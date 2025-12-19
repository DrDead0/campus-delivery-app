import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/db";
import Order from "@/app/models/order.model";
import Store from "@/app/models/store.model";
import VendingMachine from "@/app/models/vendingMachine.model";
import * as XLSX from "xlsx";
import { cookies } from "next/headers";

async function getAuth() {
    const cookieStore = await cookies();
    return cookieStore.get("admin_auth")?.value === "1";
}

export async function GET(req: NextRequest) {
    const isAuthed = await getAuth();
    if (!isAuthed) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("sourceId");
    const sourceType = searchParams.get("sourceType"); // "STORE", "VENDING", "ALL"
    const range = searchParams.get("range"); // "today", "yesterday", "2days", "week", "month", "custom"
    let startDateParam = searchParams.get("startDate");
    let endDateParam = searchParams.get("endDate");

    // Calculate Date Range
    const now = new Date();
    let start = new Date();
    let end = new Date();

    // Reset times for accurate day comparison (optional, but good for "today")
    // For "today", we want from 00:00 to now (or 23:59)

    if (range === "custom" && startDateParam && endDateParam) {
        start = new Date(startDateParam);
        end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999); // Include the full end day
    } else {
        // Presets
        end = new Date(); // End is always now for presets

        switch (range) {
            case "today":
                start = new Date();
                start.setHours(0, 0, 0, 0);
                break;
            case "yesterday":
                start = new Date();
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case "2days":
                start = new Date();
                start.setDate(start.getDate() - 1); // Yesterday + Today
                start.setHours(0, 0, 0, 0);
                break;
            case "week":
                start = new Date();
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                break;
            case "month":
                start = new Date();
                start.setMonth(start.getMonth() - 1);
                start.setHours(0, 0, 0, 0);
                break;
            default: // Default to Month or All Time? Let's say Month if unspecified, or handle empty?
                // If completely unspecified, maybe all time, but safer to default to something reasonable.
                start = new Date(0); // All time if nothing matches
                break;
        }
    }

    // Build Query
    const query: any = {
        // Only completed/confirmed orders? Or all? User likely wants valid sales.
        // Let's exclude CANCELLED and PENDING payment if online?
        // Usually sales report includes CONFIRMED, PREPARING, READY, DELIVERED.
        status: { $in: ["CONFIRMED", "PREPARING", "READY", "DELIVERED"] },
        createdAt: { $gte: start, $lte: end },
    };

    // Filter by Source
    if (sourceType === "STORE" && sourceId) {
        query["items.sourceId"] = sourceId;
        query["items.sourceModel"] = "Store"; // Strict check if needed
    } else if (sourceType === "VENDING" && sourceId) {
        query["items.sourceId"] = sourceId;
        query["items.sourceModel"] = "VendingMachine";
    }

    try {
        const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

        // Prepare Data for Excel
        // We need to fetch source names mapping if showing "ALL"
        // Or we just show what's in the order items.

        // Let's create a flat structure. One row per ITEM or per ORDER?
        // Sales reports are often per-item for granularity, or per-order for summary.
        // "Sales Excel File" usually implies line items to calculate breakdown.
        // Let's do Line Items.

        const rows: any[] = [];

        for (const order of orders) {
            for (const item of (order.items || [])) {
                // Filter items if specific source filtered
                if (sourceType === "STORE" && sourceId && item.sourceId !== sourceId) continue;
                if (sourceType === "VENDING" && sourceId && item.sourceId !== sourceId) continue;

                const row = {
                    "Order ID": (order._id as any).toString(),
                    "Date": new Date(order.createdAt).toLocaleDateString(),
                    "Time": new Date(order.createdAt).toLocaleTimeString(),
                    "Item Name": item.name,
                    "Quantity": item.quantity,
                    "Price": item.price,
                    "Total": item.price * item.quantity,
                    "Source Type": item.sourceModel,
                    "Source ID": item.sourceId,
                    // "Source Name": item.sourceName || "", // Only if we populated this locally or have it
                    "Status": order.status,
                    "Payment Method": order.paymentMethod,
                    "Payment Status": order.paymentStatus,
                    "Is Settled": item.isSettled ? "Yes" : "No"
                };
                rows.push(row);
            }
        }

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

        // Create filename
        const filename = `Sales_Report_${range}_${new Date().toISOString().split('T')[0]}.xlsx`;

        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });

    } catch (err: any) {
        console.error("Export error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
