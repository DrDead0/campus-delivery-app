import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/app/db';
import User from '@/app/models/user.model';
import bcrypt from 'bcrypt';
import { signToken } from '@/app/utils/jwt';

export async function POST(request: NextRequest) {
    try {
        const { email, password, name, phone, address, roomNumber } = await request.json();
        const conn = await dbConnect();
        if (!conn) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }
        if (!email || !password || !name || !phone || !address) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            roomNumber
        });

        const token = signToken({ id: newUser._id, email: newUser.email });
        return NextResponse.json({ token }, { status: 201 });
    } catch (err) {
        console.error('Registration error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
