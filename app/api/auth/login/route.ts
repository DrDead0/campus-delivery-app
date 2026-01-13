import { NextResponse, type NextRequest } from "next/server";
import dbConnect from "@/app/db";
import User from "@/app/models/user.model";
import bcrypt from "bcryptjs";
import { signToken } from "@/app/utils/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const conn = await dbConnect();
    if (!conn) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Email is incorrect" },
        { status: 401 }
      );
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 401 }
      );
    }
    const token = signToken({ id: user._id, email: user.email });
    return NextResponse.json({ token }, { status: 200 });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
