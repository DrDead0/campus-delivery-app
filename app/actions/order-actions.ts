"use server";

import dbConnect from "@/app/db";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Types } from "mongoose";
import { sendOrderNotification } from "@/app/utils/mail";
import path from "path";
import fs from "fs";


function getEnvManual(key: string): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");


    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");


      const allKeys = content.match(/^\s*([A-Z_]+)\s*=/gm) || [];



      const regex = new RegExp(
        `^\\s*${key}\\s*=\\s*["']?(.*?)["']?\\s*(?:#.*)?$`,
        "m"
      );
      const match = content.match(regex);

      if (match) {

        return match[1].trim();
      } else {

      }
    } else {

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
  roomNumber?: string;
}

export async function createOrder({
  userId,
  items,
  totalAmount,
  paymentMethod,
  address,
  roomNumber,
}: CreateOrderParams) {
  await dbConnect();

  try {
    const user = await User.findById(userId);



    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "ONLINE" ? "PENDING" : "PENDING",
      status: "PENDING",
      address: address,
      roomNumber: roomNumber,
      userName: user ? user.name : "Unknown",
      userPhone: user ? user.phone : "",
    });


    let razorpayOrderData = null;

    if (paymentMethod === "ONLINE") {
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


      const razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${new Date().getTime()}`,
      };
      const order = await razorpayInstance.orders.create(options);
      newOrder.razorpayOrderId = order.id;
      razorpayOrderData = order;
    }

    const savedOrder = await newOrder.save();


    await User.findByIdAndUpdate(userId, {
      $push: { orderHistory: savedOrder._id },
    });


    try {

      const sourceGroups: Record<string, any[]> = {};
      items.forEach((item: any) => {
        if (item.sourceModel === "Store" && item.sourceId) {
          if (!sourceGroups[item.sourceId]) sourceGroups[item.sourceId] = [];
          sourceGroups[item.sourceId].push(item);
        }
      });

      // Send emails
      for (const [sid, sItems] of Object.entries(sourceGroups)) {

        let store = await Store.findOne({ id: sid });
        if (!store && Types.ObjectId.isValid(sid))
          store = await Store.findById(sid);


        if (store && store.email) {
          await sendOrderNotification(store.email, {
            id: savedOrder._id.toString(),
            totalAmount: totalAmount,
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
      order.status = "CONFIRMED";
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

    const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });
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



    const storeIds = new Set<string>();
    const vendingIds = new Set<string>();

    ordersJson.forEach((order: any) => {
      if (order.items) {
        order.items.forEach((item: any) => {
          if (item.sourceModel === "Store") storeIds.add(String(item.sourceId));
          else if (item.sourceModel === "VendingMachine")
            vendingIds.add(String(item.sourceId));
        });
      }
    });


    const storeIdsArray = Array.from(storeIds);
    if (storeIdsArray.length > 0) {
      try {
        const objectIds = storeIdsArray
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));
        const customIds = storeIdsArray.filter((id) => !Types.ObjectId.isValid(id));

        const stores = await Store.find({
          $or: [{ _id: { $in: objectIds } }, { id: { $in: customIds } }],
        } as any).select("name phoneNumber id");

        stores.forEach((store: any) => {

          storeMap[store._id.toString()] = { name: store.name, phone: store.phoneNumber };
          if (store.id) storeMap[store.id] = { name: store.name, phone: store.phoneNumber };
        });
      } catch (e) {
        console.error("Failed to batch fetch stores", e);
      }
    }


    const vendingIdsArray = Array.from(vendingIds);
    if (vendingIdsArray.length > 0) {
      try {
        const objectIds = vendingIdsArray
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));
        const customIds = vendingIdsArray.filter((id) => !Types.ObjectId.isValid(id));

        const vms = await VendingMachine.find({
          $or: [{ _id: { $in: objectIds } }, { id: { $in: customIds } }],
        } as any).select("name names id");

        vms.forEach((vm: any) => {
          const vName = vm.names || vm.name || "Vending Machine";
          vendingMap[vm._id.toString()] = { name: vName, phone: null };
          if (vm.id) vendingMap[vm.id] = { name: vName, phone: null };
        });
      } catch (e) {
        console.error("Failed to batch fetch VMs", e);
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
          sourceName: details.name || item.name,
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
          if (!vm) {
            vm = await VendingMachine.findOne({ id: sourceId });
          }

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


    const orders = await Order.find({ "items.sourceId": storeId })
      .sort({ createdAt: -1 })
      .lean();

    if (orders.length > 0) {

    }

    // Filter items to only show those belonging to this store
    const filteredOrders = orders
      .map((order: any) => {
        const relevantItems = (order.items || [])
          .filter((item: any) => String(item.sourceId) === String(storeId))
          .map((item: any) => {

            const { image, ...rest } = item;
            return rest;
          });
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

    const storeIds = new Set<string>();
    const vendingIds = new Set<string>();

    ordersJson.forEach((order: any) => {
      if (order.items) {
        order.items.forEach((item: any) => {
          if (item.sourceModel === "Store") storeIds.add(String(item.sourceId));
          else if (item.sourceModel === "VendingMachine")
            vendingIds.add(String(item.sourceId));
        });
      }
    });


    const storeIdsArray = Array.from(storeIds);
    if (storeIdsArray.length > 0) {
      try {
        const objectIds = storeIdsArray
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));
        const customIds = storeIdsArray.filter((id) => !Types.ObjectId.isValid(id));

        const stores = await Store.find({
          $or: [{ _id: { $in: objectIds } }, { id: { $in: customIds } }],
        } as any).select("name phoneNumber id");

        stores.forEach((store: any) => {
          storeMap[store._id.toString()] = { name: store.name, phone: store.phoneNumber };
          if (store.id) storeMap[store.id] = { name: store.name, phone: store.phoneNumber };
        });
      } catch (e) {
        console.error("Failed to batch fetch stores", e);
      }
    }


    const vendingIdsArray = Array.from(vendingIds);
    if (vendingIdsArray.length > 0) {
      try {
        const objectIds = vendingIdsArray
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));
        const customIds = vendingIdsArray.filter((id) => !Types.ObjectId.isValid(id));

        const vms = await VendingMachine.find({
          $or: [{ _id: { $in: objectIds } }, { id: { $in: customIds } }],
        } as any).select("name names id");

        vms.forEach((vm: any) => {
          const vName = vm.names || vm.name || "Vending Machine";
          vendingMap[vm._id.toString()] = { name: vName, phone: null };
          if (vm.id) vendingMap[vm.id] = { name: vName, phone: null };
        });
      } catch (e) {
        console.error("Failed to batch fetch VMs", e);
      }
    }

    const enrichedOrders = ordersJson.map((order: any) => {


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


      const cleanItems = (order.items || []).map((item: any) => {

        const { image, ...rest } = item;
        return rest;
      });

      return {
        ...order,
        items: cleanItems,
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


    if (order.status === "CANCELLED" || order.status === "DELIVERED") {
      return { ok: false, error: "Cannot update status for this order" };
    }


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

    order.status = newStatus as
      | "PENDING"
      | "CONFIRMED"
      | "PREPARING"
      | "READY"
      | "DELIVERED";
    await order.save();

    return { ok: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { ok: false, error: "Failed to update order status" };
  }
}