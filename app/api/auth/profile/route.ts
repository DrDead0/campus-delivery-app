import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/app/db';
import User from '@/app/models/user.model';
import { verifyToken } from '@/app/utils/jwt';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing Authorization' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token) as any;
    if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const conn = await dbConnect();
    if (!conn) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    const user = await User.findById(payload.id).select('email phone name address roomNumber');
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
        email: user.email,
        phone: user.phone,
        name: user.name,
        address: user.address,
        roomNumber: user.roomNumber,
    });
}
