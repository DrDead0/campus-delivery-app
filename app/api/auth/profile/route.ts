import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/app/db";
import User from "@/app/models/user.model";
import { verifyToken } from "@/app/utils/jwt";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization" },
      { status: 401 }
    );
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token) as any;
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const conn = await dbConnect();
  if (!conn) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }
  const user = await User.findById(payload.id).select(
    "email phone name address"
  );
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    email: user.email,
    phone: user.phone,
    name: user.name,
    address: user.address,
  });
}

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization" },
      { status: 401 }
    );
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token) as any;
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { name, phone, address } = await request.json();

    const conn = await dbConnect();
    if (!conn) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.id,
      { name, phone, address },
      { new: true, runValidators: true }
    ).select("email phone name address");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: updatedUser.email,
      phone: updatedUser.phone,
      name: updatedUser.name,
      address: updatedUser.address,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
