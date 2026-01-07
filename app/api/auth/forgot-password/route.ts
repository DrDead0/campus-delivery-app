import { NextResponse } from "next/server";
import connectToDatabase from "@/app/db";
import User from "@/app/models/user.model";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user) {
            // For security, do not reveal if user exists
            return NextResponse.json(
                { message: "If a user with this email exists, an OTP has been sent." },
                { status: 200 }
            );
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP and set to resetPasswordToken field (reusing this field for OTP)
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // Set expire time (15 minutes for OTP)
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        await user.save();

        // STRICT SMTP Config per user request
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

        if (!smtpUser || !smtpPass) {
            console.error("Missing Email Credentials: SMTP_USER or SMTP_PASS is missing in .env.local");
            return NextResponse.json(
                { message: "Server Misconfiguration: Missing Email Credentials" },
                { status: 500 }
            );
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const message = {
            from: smtpUser,
            to: user.email,
            subject: "Password Reset OTP",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset OTP</h1>
            <p>You requested a password reset. Use the following code to reset your password:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <h2 style="font-size: 32px; letter-spacing: 5px; color: #000; margin: 0;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 14px;">This code expires in 15 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
        };

        try {
            await transporter.sendMail(message);

            return NextResponse.json(
                { message: "OTP sent successfully" },
                { status: 200 }
            );
        } catch (err: any) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            console.error("Email send error:", err);
            return NextResponse.json(
                { message: `Email could not be sent: ${err.message}` },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
