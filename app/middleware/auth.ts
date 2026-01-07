import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt';

export async function authMiddleware(request:any) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // Attach payload to request for downstream handlers
    request.user = payload; // @ts-ignore
    return null; // indicate success
}
