"use server";

import dbConnect from "@/app/db";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Types } from "mongoose";
import { sendOrderNotification } from "@/app/utils/mail";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

// Helper to manually parse env file
// Helper to manually parse env file
function getEnvManual(key: string): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    console.log(`[ManualEnv] Checking path: ${envPath}`);

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");

      // Debug: Log all keys found in the file (safely)
      const allKeys = content.match(/^\s*([A-Z_]+)\s*=/gm) || [];
      console.log(
        `[ManualEnv] Keys found in file: ${allKeys
          .map((k) => k.split("=")[0].trim())
          .join(", ")}`
      );

      // Robust regex:
      // 1. Start of line (with optional whitespace)
      // 2. Key
      // 3. Optional whitespace, =, optional whitespace
      // 4. Value group:
      //    - optional quote
      //    - content (lazy)
      //    - optional quote
      // 5. Ignore trailing comments or whitespace
      const regex = new RegExp(
        `^\\s*${key}\\s*=\\s*["']?(.*?)["']?\\s*(?:#.*)?$`,
        "m"
      );
      const match = content.match(regex);

      if (match) {
        console.log(`[ManualEnv] Found value for ${key}`);
        return match[1].trim();
      } else {
        console.log(`[ManualEnv] NO match for ${key}`);
      }
    } else {
      console.log(`[ManualEnv] File not found at ${envPath}`);
    }
  } catch (e) {
    console.error("Manual env parse failed:", e);
  }
  return undefined;
}

interface CreateOrderParams {
  userId: string;
  items: any[];
  totalAmount: number;
  paymentMethod: string;
  address: any;
}

export async function createOrder({
  userId,
  items,
  totalAmount,
  paymentMethod,
  address,
}: CreateOrderParams) {
  await dbConnect();

  try {
    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "ONLINE" ? "PENDING" : "PENDING", // Update to COMPLETED immediately if COD? Usually COD is PENDING until delivery.
      status: "PENDING",
      address: address,
      // Add other fields if needed from address
    });

    let razorpayOrderData = null;

    if (paymentMethod === "ONLINE") {
      // Try process.env first, then manual parsing
      let keyId =
        process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      let keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId)
        keyId =
          getEnvManual("RAZORPAY_KEY_ID") ||
          getEnvManual("NEXT_PUBLIC_RAZORPAY_KEY_ID");
      if (!keySecret) keySecret = getEnvManual("RAZORPAY_KEY_SECRET");

      if (!keyId || !keySecret || keyId === "rzp_test_placeholder") {
        const cwd = process.cwd();
        const envKeys = Object.keys(process.env).filter((k) =>
          k.includes("RAZORPAY")
        );

        console.error("Razorpay keys missing or using placeholder", {
          keyIdPresent: !!keyId,
          keySecretPresent: !!keySecret,
          isPlaceholder: keyId === "rzp_test_placeholder",
          cwd: cwd,
          envKeysFound: envKeys,
        });

        let errorDetails = `Payment gateway configuration missing. CWD: ${cwd}. EnvKeys: ${envKeys.join(
          ", "
        )}.`;
        if (!keyId)
          errorDetails += " (Key ID missing - check .env.local format)";
        else if (keyId === "rzp_test_placeholder")
          errorDetails += " (Key ID is placeholder)";
        if (!keySecret)
          errorDetails += " (Key Secret missing - check .env.local format)";

        return { success: false, error: errorDetails };
      }

      if (!totalAmount || totalAmount <= 0) {
        return { success: false, error: "Invalid total amount." };
      }

      // Initialize Razorpay instance with the fresh keys
      const razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: Math.round(totalAmount * 100), // amount in lowest currency unit (paise)
        currency: "INR",
        receipt: `receipt_${new Date().getTime()}`,
      };
      const order = await razorpayInstance.orders.create(options);
      newOrder.razorpayOrderId = order.id;
      razorpayOrderData = order;
    }

    const savedOrder = await newOrder.save();

    // Add to user history
    await User.findByIdAndUpdate(userId, {
      $push: { orderHistory: savedOrder._id },
    });

    // Notify Stores
    try {
      // Group items by source to avoid duplicate emails to same store for mixed items?
      // Though normally cart is one store. But let's be safe.
      const sourceGroups: Record<string, any[]> = {};
      items.forEach((item: any) => {
        if (item.sourceModel === "Store" && item.sourceId) {
          if (!sourceGroups[item.sourceId]) sourceGroups[item.sourceId] = [];
          sourceGroups[item.sourceId].push(item);
        }
      });

      // Send emails
      for (const [sid, sItems] of Object.entries(sourceGroups)) {
        // Try custom ID then ObjectId
        let store = await Store.findOne({ id: sid });
        if (!store && Types.ObjectId.isValid(sid))
          store = await Store.findById(sid);

        // If username is an email, send notification
        if (store && store.email) {
          await sendOrderNotification(store.email, {
            id: savedOrder._id.toString(),
            totalAmount: totalAmount, // This is grand total, maybe calculate store total?
            // calculate store total
            items: sItems,
          });
        }
      }
    } catch (e) {
      console.error("Failed to send notifications", e);
    }

    return {
      success: true,
      orderId: savedOrder._id.toString(),
      razorpayOrder: razorpayOrderData,
    };
  } catch (error: any) {
    console.error("Error creating order:", error);
    // detailed logging
    if (error.error) console.error("Razorpay Error Details:", error.error);

    const errorMessage =
      error?.message || (typeof error === "string" ? error : "Unknown error");
    return { success: false, error: errorMessage };
  }
}

interface VerifyPaymentParams {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function verifyPayment({
  orderId,
  razorpayPaymentId,
  razorpaySignature,
}: VerifyPaymentParams) {
  await dbConnect();

  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Dynamic load for verification as well
    // try {
    //     const envPath = path.resolve(process.cwd(), '.env.local');
    //     dotenv.config({ path: envPath, override: true });
    // } catch (e) { /* ignore */ }

    let keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) keySecret = getEnvManual("RAZORPAY_KEY_SECRET");

    if (!keySecret)
      throw new Error("Payment verification failed: Configuration missing");

    const generated_signature = crypto
      .createHmac("sha256", keySecret)
      .update(order.razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generated_signature === razorpaySignature) {
      order.paymentStatus = "COMPLETED";
      order.razorpayPaymentId = razorpayPaymentId;
      order.status = "CONFIRMED"; // Auto confirm on payment?
      await order.save();
      return { success: true };
    } else {
      return { success: false, error: "Invalid signature" };
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

export async function getUserOrders(userId: string) {
  await dbConnect();
  try {
    // Query the Order collection directly instead of relying on user.orderHistory array.
    // This is more robust and finds "orphaned" orders.
    const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });
    const ordersJson = JSON.parse(JSON.stringify(orders));

    // Enrich orders with source details (Name, Phone)
    // We can do this efficiently by gathering all unique source IDs first
    // But for simplicity and acceptable performance with reasonable order history size,
    // we can just lookup as we map or do a Promise.all
    // Let's try to be smart about it.

    const sourceIds = new Set();
    ordersJson.forEach((order: any) => {
      if (order.items && order.items.length > 0) {
        // Usually an order is from ONE source, but our schema allows multiple?
        // Schema has items array, each item has sourceId.
        // In practice, a cart is usually per-store.
        // let's grab unique sourceIds from all items in all orders.
        order.items.forEach((item: any) => {
          if (item.sourceId) sourceIds.add(item.sourceId);
        });
      }
    });

    const storeMap: Record<string, { name: string; phone: string | null }> = {}; // id -> { name, phone }
    const vendingMap: Record<string, { name: string; phone: string | null }> =
      {}; // id -> { name, phone }

    // Fetch details for all identified sources
    // We have to check both Stores and VendingMachines because sourceIds are mixed?
    // Actually items have sourceModel: 'Store' or 'VendingMachine'.
    // Let's split IDs by type.

    const storeIds = new Set();
    const vendingIds = new Set();

    ordersJson.forEach((order: any) => {
      if (order.items) {
        order.items.forEach((item: any) => {
          if (item.sourceModel === "Store") storeIds.add(item.sourceId);
          else if (item.sourceModel === "VendingMachine")
            vendingIds.add(item.sourceId);
        });
      }
    });

    // Loop stores
    for (const sid of Array.from(storeIds)) {
      try {
        // Try finding by custom ID first (as String)
        let store: any = await Store.findOne({ id: sid }).select(
          "name phoneNumber"
        );
        if (!store && Types.ObjectId.isValid(sid as string)) {
          store = await Store.findById(sid).select("name phoneNumber");
        }
        if (store) {
          storeMap[sid as string] = {
            name: store.name,
            phone: store.phoneNumber,
          };
        }
      } catch (e) {
        console.error(`Failed to fetch store ${sid}`, e);
      }
    }

    // Loop vending machines
    for (const vid of Array.from(vendingIds)) {
      try {
        let vm: any = null;
        if (Types.ObjectId.isValid(vid as string)) {
          vm = await VendingMachine.findById(vid).select("name names");
        }
        if (!vm) {
          // Try finding by other custom ID if exists? VendingMachine model usually just uses _id unless specified.
          // Let's assume _id for now based on typical usage
        }

        if (vm) {
          const vName = vm.names || vm.name || "Vending Machine";
          // Vending machines usually don't have phone numbers for users to call, maybe admin contact?
          // We'll leave phone blank for now.
          vendingMap[vid as string] = { name: vName, phone: null };
        }
      } catch (e) {
        console.error(`Failed to fetch VM ${vid}`, e);
      }
    }

    // Attach to orders
    const enrichedOrders = ordersJson.map((order: any) => {
      const enrichedItems = order.items.map((item: any) => {
        let details: { name: string; phone: string | null } = {
          name: "Unknown",
          phone: null,
        };
        if (item.sourceModel === "Store")
          details = storeMap[item.sourceId] || details;
        else if (item.sourceModel === "VendingMachine")
          details = vendingMap[item.sourceId] || details;

        return {
          ...item,
          sourceName: details.name || item.name, // Fallback to item name if source unknown? No, maybe just "Unknown Store"
          sourcePhone: details.phone,
        };
      });
      return { ...order, items: enrichedItems };
    });

    return enrichedOrders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

import Store from "@/app/models/store.model";
import VendingMachine from "@/app/models/vendingMachine.model";

export async function getAdminStats() {
  await dbConnect();
  try {
    const rawStats = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { status: { $ne: "CANCELLED" } } },
      {
        $group: {
          _id: { source: "$items.source", sourceId: "$items.sourceId" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          settledAmount: {
            $sum: {
              $cond: [
                { $eq: ["$items.isSettled", true] },
                { $multiply: ["$items.price", "$items.quantity"] },
                0,
              ],
            },
          },
          unsettledAmount: {
            $sum: {
              $cond: [
                { $eq: ["$items.isSettled", false] },
                { $multiply: ["$items.price", "$items.quantity"] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const storeStats = [];
    const vendingStats = [];

    for (const stat of rawStats) {
      const { source, sourceId } = stat._id;
      let name = "Unknown";
      try {
        if (source === "STORE") {
          let store = null;
          if (Types.ObjectId.isValid(sourceId)) {
            store = await Store.findById(sourceId);
          }
          if (!store) {
            store = await Store.findOne({ id: sourceId });
          }

          if (store) name = store.name;
          storeStats.push({
            _id: sourceId.toString(),
            name,
            totalRevenue: stat.totalRevenue,
            settledAmount: stat.settledAmount,
            unsettledAmount: stat.unsettledAmount,
          });
        } else if (source === "VENDING") {
          let vm = null;
          if (Types.ObjectId.isValid(sourceId)) {
            vm = await VendingMachine.findById(sourceId);
          }
          // Assuming VendingMachine might also have custom ID logic or simple string id
          // If not, we just rely on findById. But let's be safe.
          // If VendingMachine model has 'id' field, we could check that too.

          if (vm) name = vm.names || vm.name || "Vending Machine";
          vendingStats.push({
            _id: sourceId.toString(),
            name,
            totalRevenue: stat.totalRevenue,
            settledAmount: stat.settledAmount,
            unsettledAmount: stat.unsettledAmount,
          });
        }
      } catch (err) {
        console.error(`Error fetching details for ${source} ${sourceId}`, err);
      }
    }

    return {
      storeStats: JSON.parse(JSON.stringify(storeStats)),
      vendingStats: JSON.parse(JSON.stringify(vendingStats)),
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    return { storeStats: [], vendingStats: [] };
  }
}

export async function settleOrders(sourceId: string) {
  await dbConnect();
  try {
    // Mark all items from this source as settled
    // This is complex because we need to update 'items' inside 'Order'.
    // We can use array filters.

    await Order.updateMany(
      { "items.sourceId": sourceId, "items.isSettled": false },
      { $set: { "items.$[elem].isSettled": true } },
      { arrayFilters: [{ "elem.sourceId": sourceId, "elem.isSettled": false }] }
    );

    return { success: true };
  } catch (error) {
    console.error("Error settling orders:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

export async function getStoreOrders(storeId: string) {
  await dbConnect();
  try {
    // Find orders that have at least one item from this store
    // We need to filter items in the result to only show items from this store?
    // User wants to see the order. Usually showing the full order is okay,
    // OR showing only relevant items.
    // For simplicity and correctness for the Store Owner, they should probably only see THEIR items.
    // But the Order object structure has 'items' array.
    // I'll return the full order but maybe the UI should highlight their items.
    // The query finds orders where "items.sourceId" matches.
    // NOTE: storeId might be the custom 'id' string (e.g. "2") or an ObjectId string.
    // Our Store model uses custom 'id' for sourceId in items (usually).

    const orders = await Order.find({ "items.sourceId": storeId })
      .sort({ createdAt: -1 })
      .lean();

    // Filter items to only show those belonging to this store
    const filteredOrders = orders
      .map((order: any) => {
        const relevantItems = (order.items || []).filter(
          (item: any) => String(item.sourceId) === String(storeId)
        );
        return {
          ...order,
          items: relevantItems,
        };
      })
      .filter((order: any) => order.items.length > 0);

    return JSON.parse(JSON.stringify(filteredOrders));
  } catch (error) {
    console.error("Error fetching store orders:", error);
    return [];
  }
}

export async function cancelOrderAction(orderId: string) {
  await dbConnect();
  try {
    const order = await Order.findById(orderId);
    if (!order) return { ok: false, error: "Order not found" };

    // Allow cancellation only for PENDING or CONFIRMED
    // (customize as needed based on logic)
    if (["PENDING", "CONFIRMED"].includes(order.status)) {
      order.status = "CANCELLED";
      await order.save();
      return { ok: true };
    }

    return { ok: false, error: "Order cannot be cancelled in current status" };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { ok: false, error: "Failed to cancel order" };
  }
}

export async function getAllOrdersForAdmin() {
  await dbConnect();
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone")
      .lean();

    const ordersJson = JSON.parse(JSON.stringify(orders));

    const sourceIds = new Set();
    ordersJson.forEach((order: any) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          if (item.sourceId) sourceIds.add(item.sourceId);
        });
      }
    });

    const storeMap: Record<string, { name: string; phone: string | null }> = {};
    const vendingMap: Record<string, { name: string; phone: string | null }> =
      {};

    const storeIds = new Set();
    const vendingIds = new Set();

    ordersJson.forEach((order: any) => {
      if (order.items) {
        order.items.forEach((item: any) => {
          if (item.sourceModel === "Store") storeIds.add(item.sourceId);
          else if (item.sourceModel === "VendingMachine")
            vendingIds.add(item.sourceId);
        });
      }
    });

    for (const sid of Array.from(storeIds)) {
      try {
        let store: any = await Store.findOne({ id: sid }).select(
          "name phoneNumber"
        );
        if (!store && Types.ObjectId.isValid(sid as string)) {
          store = await Store.findById(sid).select("name phoneNumber");
        }
        if (store) {
          storeMap[sid as string] = {
            name: store.name,
            phone: store.phoneNumber,
          };
        }
      } catch (e) {
        console.error(`Failed to fetch store ${sid}`, e);
      }
    }

    for (const vid of Array.from(vendingIds)) {
      try {
        let vm: any = null;
        if (Types.ObjectId.isValid(vid as string)) {
          vm = await VendingMachine.findById(vid).select("name names");
        }
        if (vm) {
          const vName = vm.names || vm.name || "Vending Machine";
          vendingMap[vid as string] = { name: vName, phone: null };
        }
      } catch (e) {
        console.error(`Failed to fetch VM ${vid}`, e);
      }
    }

    const enrichedOrders = ordersJson.map((order: any) => {
      // Assuming all items in an order are from the same source for simplicity of display,
      // or we just take the first source we find to label the order source.
      // But items might be mixed? Usually not?
      // Let's resolve source for the order display based on the first item.

      const firstItem = order.items[0];
      let sourceName = "Unknown Source";

      if (firstItem) {
        if (firstItem.sourceModel === "Store") {
          sourceName = storeMap[firstItem.sourceId]?.name || "Unknown Store";
        } else if (firstItem.sourceModel === "VendingMachine") {
          sourceName =
            vendingMap[firstItem.sourceId]?.name || "Vending Machine";
        }
      }

      const storeTotal = order.items.reduce(
        (acc: number, item: any) =>
          acc + (item.price || 0) * (item.quantity || 1),
        0
      );

      return {
        ...order,
        sourceName,
        storeTotal,
        userName: order.userId?.name || "Unknown User",
        userEmail: order.userId?.email,
        userPhone: order.userId?.phone,
      };
    });

    return enrichedOrders;
  } catch (error) {
    console.error("Error fetching all orders for admin:", error);
    return [];
  }
}

export async function cancelOrderActionV2(orderId: string) {
  await dbConnect();
  try {
    const order = await Order.findById(orderId);
    if (!order) return { ok: false, error: "Order not found" };

    // Allow cancellation if PENDING or CONFIRMED
    // (Assuming CONFIRMED is before PREPARING)
    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      return { ok: false, error: "Order cannot be cancelled at this stage" };
    }

    order.status = "CANCELLED";
    await order.save();

    return { ok: true };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { ok: false, error: "Failed to cancel order" };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string
) {
  await dbConnect();
  try {
    const order = await Order.findById(orderId);
    if (!order) return { ok: false, error: "Order not found" };

    // Allow status updates only for non-cancelled, non-delivered orders
    if (order.status === "CANCELLED" || order.status === "DELIVERED") {
      return { ok: false, error: "Cannot update status for this order" };
    }

    // Validate status transition
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "DELIVERED",
    ];
    if (!validStatuses.includes(newStatus)) {
      return { ok: false, error: "Invalid status" };
    }

    order.status = newStatus;
    await order.save();

    return { ok: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { ok: false, error: "Failed to update order status" };
  }
}
