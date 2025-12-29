const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config({ path: ".env.local" });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("No MONGO_URI found");
  process.exit(1);
}

const vendingMachineSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    names: { type: String, required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 0 },
        price: Number,
      },
    ],
  },
  { timestamps: true }
);

const VendingMachine =
  mongoose.models.VendingMachine ||
  mongoose.model("VendingMachine", vendingMachineSchema);

async function fix() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    const machines = await VendingMachine.find({});

    for (const machine of machines) {
      let changed = false;
      if (machine.items && machine.items.length > 0) {
        machine.items.forEach((item) => {
          if (item.quantity === 0) {
            item.quantity = 20; // Set default stock
            changed = true;
          }
        });
      }

      if (changed) {
        await machine.save();
        console.log(`Updated stock for machine: ${machine.names}`);
      } else {
        console.log(`No zero-stock items found for: ${machine.names}`);
      }
    }

    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fix();
