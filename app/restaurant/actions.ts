"use server";

import dbConnect from "@/app/db";
import Store from "@/app/models/store.model";
import VendingMachine from "@/app/models/vendingMachine.model";
import { revalidatePath } from "next/cache";

import Product from "@/app/models/product.model";

export async function getStoresAction(timestamp?: number) {
  await dbConnect();
  // Ensure Product model is registered
  if (!Product) {
    // no-op, just ensuring import
  }
  const stores = await Store.find({}).populate("items.productId").lean();
  return JSON.parse(JSON.stringify(stores)).map((store: any) => ({
    ...store,
    id: store.id || store._id,
  }));
}

export async function getVendingMachinesAction(timestamp?: number) {
  await dbConnect();
  const vms = await VendingMachine.find({}).lean();
  return JSON.parse(JSON.stringify(vms)).map((vm: any) => ({
    ...vm,
    id: vm.id || vm._id,
    name: vm.names,
    location: vm.location,
    hostel: vm.hostel,
    building: vm.building,
    image: vm.image, // Pass image to client
  }));
}
export async function getVendingMachineById(id: string) {
  await dbConnect();
  // Ensure Product model is registered
  if (!Product) {
    // no-op
  }
  const vm = await VendingMachine.findOne({ id })
    .populate("items.productId")
    .lean();

  if (!vm) return null;

  return JSON.parse(JSON.stringify(vm));
}
