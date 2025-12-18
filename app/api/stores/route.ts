import dbConnect from '@/app/db';
import Store from '@/app/models/store.model';
import "@/app/models/product.model"; 
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  // Populate each store item's product reference so the UI can show name/price
  const stores = await Store.find({})
    .populate({ path: 'items.productId', model: 'Product' })
    .lean();
  return NextResponse.json(stores);
}
