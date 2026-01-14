import { NextResponse } from "next/server";
import dbConnect from "@/app/db";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function GET() {
    const diagnostic = {
        timestamp: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            MONGO_URI_CONFIGURED: !!process.env.MONGO_URI,
            MONGODB_URI_CONFIGURED: !!process.env.MONGODB_URI,
            // List all keys to verify what Amplify is actually passing
            ALL_ENV_KEYS: Object.keys(process.env).sort(),
        },
        db: {
            readyState: mongoose.connection.readyState,
            readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
            host: mongoose.connection.host,
            name: mongoose.connection.name,
        },
        connectionAttempt: null as any,
    };

    try {
        const conn = await dbConnect();
        if (conn) {
            diagnostic.connectionAttempt = {
                success: true,
                message: "Successfully received connection object"
            };
        } else {
            diagnostic.connectionAttempt = {
                success: false,
                message: "dbConnect() returned null",
                error: "Database not configured (missing env vars)"
            };
        }
    } catch (error: any) {
        diagnostic.connectionAttempt = {
            success: false,
            message: "dbConnect() threw an error",
            error: error.message,
            stack: error.stack
        };
    }

    return NextResponse.json(diagnostic, { status: 200 });
}
