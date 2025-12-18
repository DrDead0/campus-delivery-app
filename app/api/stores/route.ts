import { NextResponse } from "next/server";
import dbConnect from "@/app/db";
import Store from "@/app/models/store.model";
import Product from "@/app/models/product.model"; // Ensure model is registered

export async function GET() {
  await dbConnect();
  try {
    const stores = await Store.find({}).populate({
      path: "items.productId",
      model: "Product",
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { id, name, description, items } = body;

    const store = await Store.create({
      id,
      name,
      description,
      items: items || [],
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}
