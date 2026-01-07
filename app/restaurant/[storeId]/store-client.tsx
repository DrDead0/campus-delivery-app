"use client";

import { use, useState, useEffect, useMemo } from "react";
import { DeliveryScreen } from "@/components/delivery-screen";
import { useCart } from "@/app/context/CartContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

export default function StoreClient({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const router = useRouter();
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

  const [store, setStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch("/api/stores", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const found = data.find(
            (s: any) => s.id === storeId || s._id === storeId
          );
          setStore(found || null);
        }
      } catch (err) {
        console.error("Failed to fetch store:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
    fetchStore();
    // Removed polling interval for optimization
  }, [storeId]);

  const deliveryItems = useMemo(() => {
    if (!store) return [];
    return store.items
      .filter((item: any) => item.productId)
      .map((item: any) => ({
        id: item.productId._id,
        name: item.productId.name,
        description: item.productId.Description,
        price: item.price || item.productId.price,
        availability:
          (item.availability || item.productId.availability) === "outOfStock"
            ? "unavailable"
            : "available",
        type: item.productId.type || "veg",
        icon: ShoppingCart,
        image: item.productId.image,
      }));
  }, [store]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading store...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Store not found</p>
        <Button onClick={() => router.push("/restaurant")}>
          Back to Restaurants
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
          onClick={() => router.push("/restaurant")}
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
          // Found the item in deliveryItems
          // We need to construct the CartItem object
          // item here is from DeliveryScreen's onAddToCart call which passes the item object from deliveryItems

          // Wait, DeliveryScreen onAddToCart(item) passes the simplified screen item.
          // We need to map it back to CartItem schema
          addToCart({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            source: "STORE",
            sourceId: storeId, // Using current storeId context
            sourceModel: "Store",
            image: item.image,
          });
        }}
        onProceedToCart={() => {
          if (!localStorage.getItem("token")) {
            alert("Please login to order.");
            return;
          }
          router.push("/restaurant/cart");
        }}
        totals={totals}
        selectedHostel={selectedHostel}
        setSelectedHostel={setSelectedHostel}
        roomNumber={roomNumber}
        setRoomNumber={setRoomNumber}
        store={store}
      />
    </div>
  );
}
