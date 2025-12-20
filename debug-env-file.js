const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const outputLog = [];
function log(msg) {
    console.log(msg);
    outputLog.push(msg);
}

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    log(`Checking .env.local at: ${envPath}`);

    if (fs.existsSync(envPath)) {
        log('.env.local exists.');
        const envConfig = dotenv.parse(fs.readFileSync(envPath));

        log('Parsable keys in .env.local:');
        Object.keys(envConfig).forEach(key => {
            if (key.includes('RAZORPAY')) {
                log(`- ${key}: ${envConfig[key] ? (envConfig[key].length > 4 ? 'Exists (Length: ' + envConfig[key].length + ')' : 'Too Short') : 'Empty'}`);
            }
        });

        // Check process.env after loading
        dotenv.config({ path: envPath });
        log('\nAfter dotenv.config():');
        log(`process.env.RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? 'Set' : 'Unset'}`);
        log(`process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID: ${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Set' : 'Unset'}`);

    } else {
        log('.env.local FILE NOT FOUND.');
    }
} catch (error) {
    log(`Error: ${error.message}`);
}

fs.writeFileSync('env-debug.txt', outputLog.join('\n'));
console.log('Wrote to env-debug.txt');
