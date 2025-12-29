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

const ProductSchema = new mongoose.Schema({
  name: String,
  availablity: String,
});

const VendingMachine =
  mongoose.models.VendingMachine ||
  mongoose.model("VendingMachine", vendingMachineSchema);
const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

async function check() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // Find machine with ID "1" (from screenshot "Vending Machine 1")
    // Or just list all items in all machines
    const machines = await VendingMachine.find({})
      .populate("items.productId")
      .lean();

    machines.forEach((m) => {
      console.log(`Machine: ${m.names} (ID: ${m.id})`);
      if (m.items && m.items.length > 0) {
        m.items.forEach((item) => {
          const pName = item.productId
            ? item.productId.name
            : "Unknown Product";
          console.log(`  - Product: ${pName} | Quantity: ${item.quantity}`);
        });
      } else {
        console.log("  (No items in this machine)");
      }
      console.log("---");
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
