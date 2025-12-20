import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID, // Use these keys in .env.local
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
});

export async function sendOrderNotification(to: string, orderDetails: any) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email configuration missing. Skipping email.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: to,
            subject: `New Order Received: #${orderDetails.id.slice(-6)}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>New Order Alert!</h2>
                    <p>You have received a new order with ID: <strong>#${orderDetails.id.slice(-6)}</strong></p>
                    <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
                    <p><strong>Items:</strong></p>
                    <ul>
                        ${orderDetails.items.map((item: any) => `<li>${item.quantity}x ${item.name}</li>`).join("")}
                    </ul>
                    <p>Please login to your dashboard to manage this order.</p>
                    <div style="margin-top: 20px;">
                        <a href="https://campus-delivery-app.vercel.app/" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            `,
        });
        console.log("Email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}
