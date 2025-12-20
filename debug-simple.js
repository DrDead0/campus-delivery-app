const fs = require('fs');
const path = require('path');
try {
    const content = fs.readFileSync('.env.local', 'utf8');
    const lines = content.split('\n');
    const keys = [];
    lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length > 0) keys.push(parts[0].trim());
    });

    const hasKeyId = keys.some(k => k === 'RAZORPAY_KEY_ID');
    const hasNextKeyId = keys.some(k => k === 'NEXT_PUBLIC_RAZORPAY_KEY_ID');
    const hasKeySecret = keys.some(k => k === 'RAZORPAY_KEY_SECRET');

    const output = `File read success.
    RAZORPAY_KEY_ID key found: ${hasKeyId}
    NEXT_PUBLIC_RAZORPAY_KEY_ID key found: ${hasNextKeyId}
    RAZORPAY_KEY_SECRET key found: ${hasKeySecret}
    Total lines: ${lines.length}`;

    fs.writeFileSync('simple-debug.txt', output);
} catch (e) {
    fs.writeFileSync('simple-debug.txt', 'Error reading .env.local: ' + e.message);
}
process.exit(0);
