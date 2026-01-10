"use server";

import dbConnect from "@/app/db";
import User from "@/app/models/user.model";
import nodemailer from "nodemailer";

export async function getAllUsersForAdmin() {
    try {
        await dbConnect();
        const users = await User.find({})
            .select("_id name email phone")
            .sort({ createdAt: -1 })
            .lean();

        // Serialize for client
        return users.map((u: any) => ({
            ...u,
            _id: u._id.toString(),
        }));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function getUserAddress(userId: string) {
    try {
        await dbConnect();
        const user = await User.findById(userId).select("address roomNumber");
        if (!user) return null;
        return {
            address: user.address,
            roomNumber: user.roomNumber,
        };
    } catch (error) {
        console.error("Error fetching user address:", error);
        return null;
    }
}

export async function sendAdminEmailAction(
    userIds: string[],
    subject: string,
    content: string,
    attachments: { name: string; content: string; encoding: string }[] = []
) {
    try {
        await dbConnect();

        // 1. Fetch user emails
        const users = await User.find({ _id: { $in: userIds } }).select("email");
        const emails = users.map((u) => u.email).filter(Boolean);

        if (emails.length === 0) {
            return { ok: false, error: "No valid email addresses found." };
        }
        // 2. Configure Transporter
        let transporterConfig: any = {};

        // Check for SMTP first (User explicitly requested SMTP)
        // If SMTP_PASS is available, use Standard SMTP
        if (process.env.SMTP_PASS) {
            transporterConfig = {
                // Default to gmail if SMTP_HOST is missing, otherwise use env var
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: Number(process.env.SMTP_PORT) || 587,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            };
        }
        // Fallback to OAuth2 ONLY if SMTP password is NOT set but OAuth keys ARE present
        else if (process.env.Client_ID && process.env.Client_secret && process.env.RefreshToken) {
            transporterConfig = {
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.SMTP_USER,
                    clientId: process.env.Client_ID,
                    clientSecret: process.env.Client_secret,
                    refreshToken: process.env.RefreshToken,
                }
            };
        } else {
            // Fallback just in case nothing matches
            transporterConfig = {
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: Number(process.env.SMTP_PORT) || 587,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            };
        }

        const transporter = nodemailer.createTransport(transporterConfig);

        // 3. Send Emails
        const results = await Promise.allSettled(
            emails.map(email =>
                transporter.sendMail({
                    from: process.env.SMTP_FROM || `"Campus Delivery Admin" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: subject,
                    text: content,
                    html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${content}</div>`,
                    attachments: attachments.map(att => ({
                        filename: att.name,
                        content: att.content, // base64 string
                        encoding: 'base64'
                    }))
                })
            )
        );

        const failed = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
        if (failed.length > 0) {
            console.error("Email sending failures details:", failed.map(f => f.reason));

            if (failed.length === emails.length) {
                const firstError = failed[0].reason;
                const errorMessage = firstError.message || JSON.stringify(firstError);

                // Provide specific help for common errors
                if (errorMessage.includes("ECONNREFUSED")) {
                    return { ok: false, error: "Connection Refused. Check if SMTP_HOST is set correctly in .env.local (e.g. smtp.gmail.com)." };
                }

                return {
                    ok: false,
                    error: `Failed to send emails. Error: ${errorMessage}`
                };
            }
            return { ok: true, message: `Sent to ${emails.length - failed.length} users. ${failed.length} failed.` };
        }

        return { ok: true, message: `Email sent successfully to ${emails.length} users.` };

    } catch (error: any) {
        console.error("Critical Email Error:", error);
        return { ok: false, error: `System Error: ${error.message}` };
    }
}
