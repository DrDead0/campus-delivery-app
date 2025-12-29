"use client";

import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CartItem } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";

interface CartItemsProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemsList({
  items,
  onUpdateQuantity,
  onRemove,
}: CartItemsProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
        Order Summary
        <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
          {items.length} items
        </span>
      </h2>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed bg-muted/50">
          <p>
            Your cart is empty, Or{" "}
            <span
              onClick={() => window.location.reload()}
              className="underline cursor-pointer hover:text-primary"
            >
              refresh
            </span>{" "}
            the page
          </p>
          <Button
            variant="link"
            onClick={() => router.push("/restaurant")}
            className="mt-2 text-primary block mx-auto"
          >
            Browse Snacks
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="p-3 bg-card rounded-2xl shadow-sm border border-border flex gap-4 items-center relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0 relative">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                    {item.emoji || "🍽️"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-1">
                  {item.source === "STORE" ? "Store Item" : "Vending Machine"}
                </p>
                <div className="font-bold text-primary">
                  ₹{item.price * item.quantity}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {/* Delete Button */}
                <button
                  onClick={() => onRemove(item.productId)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 bg-muted border border-border p-1.5 rounded-xl">
                  <button
                    onClick={() => onUpdateQuantity(item.productId, -1)}
                    className="w-7 h-7 flex items-center justify-center bg-background rounded-lg shadow-sm border border-border hover:bg-muted active:scale-95 transition-all text-muted-foreground"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, 1)}
                    className="w-7 h-7 flex items-center justify-center bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
