"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/app/context/CartContext";
import { DeliveryScreen } from "@/components/delivery-screen";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export default function VendingMachineDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [machine, setMachine] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    cartItems,
    addToCart,
    updateQuantity,
    totals,
    selectedHostel,
    setSelectedHostel,
    roomNumber,
    setRoomNumber,
  } = useCart();

  useEffect(() => {
    const loadMachine = async () => {
      try {
        const { getVendingMachineById } = await import("../actions");
        const data = await getVendingMachineById(id);

        if (data) {
          setMachine(data);
          const productsList = data.items
            .filter((item: any) => item.productId)
            .map((item: any) => {
              const quantity = item.quantity ?? 0;
              const availability = quantity > 0 ? "inStock" : "outOfStock";
              return {
                ...item.productId,
                availability,
                quantity,
                price: item.price || item.productId.price,
              };
            });
          setItems(productsList);
        } else {
          toast.error("Machine not found");
        }
      } catch (err) {
        console.error("Failed to load machine:", err);
      } finally {
        setLoading(false);
      }
    };
    const intervalId = setInterval(loadMachine, 2000);
    loadMachine();

    return () => clearInterval(intervalId);
  }, [id]);

  const deliveryItems = useMemo(() => {
    return items.map((item: any) => ({
      id: item._id, // Map _id to id for DeliveryScreen
      name: item.name,
      description: item.Description,
      price: item.price,
      availability: (item.availability === "outOfStock"
        ? "unavailable"
        : "available") as "unavailable" | "available" | "limited",
      type: item.type || "veg",
      image: item.image,
      quantity: item.quantity,
      emoji: "🍫",
      icon: ShoppingCart,
    }));
  }, [items]);

  const machineStore = useMemo(() => {
    if (!machine) return undefined;
    return {
      id: machine.id,
      _id: machine.id,
      name: machine.names,
      location: `${machine.location}, ${machine.building || ""}`,
      description: "24/7 Vending Machine - Instant Snacks",
      image:
        machine.image ||
        "https://images.unsplash.com/photo-1618506557292-ec27c66d6343?q=80&w=3000&auto=format&fit=crop", // Fallback Vending Image
    };
  }, [machine]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading machine...
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Machine not found</p>
        <Button onClick={() => router.push("/restaurant/vending")}>
          Back to Machines
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/restaurant/vending")}
          className="rounded-full h-8 w-8 p-0 shadow-md bg-white/80 backdrop-blur-md"
        >
          ←
        </Button>
      </div>
      <DeliveryScreen
        deliveryItems={deliveryItems}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onAddToCart={(item: any) => {
          addToCart({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            source: "VENDING",
            sourceId: id,
            sourceModel: "VendingMachine",
            image: item.image,
          });
        }}
        onProceedToCart={() => {
          if (!localStorage.getItem("token")) {
            toast.error("Please login to order");
            return;
          }
          router.push("/restaurant/cart");
        }}
        totals={totals}
        selectedHostel={selectedHostel}
        setSelectedHostel={setSelectedHostel}
        roomNumber={roomNumber}
        setRoomNumber={setRoomNumber}
        store={machineStore}
      />
    </div>
  );
}
