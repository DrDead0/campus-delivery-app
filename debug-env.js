const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env.local from:', envPath);

if (fs.existsSync(envPath)) {
    console.log('.env.local exists.');
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error('Error loading .env.local:', result.error);
    } else {
        console.log('Loaded .env.local successfully.');
        console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'EXISTS' : 'MISSING');
        console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'EXISTS' : 'MISSING');
        console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'EXISTS' : 'MISSING');
    }
} else {
    console.error('.env.local does NOT exist at:', envPath);
    // Listing root dir
    console.log('Root dir contents:', fs.readdirSync(process.cwd()));
}
