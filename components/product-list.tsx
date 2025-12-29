"use strict";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductListProps {
  items: any[];
}

export function ProductList({ items }: ProductListProps) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">🍽️</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold">No items found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Try selecting a different category or searching for something else.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 px-4 pb-20">
      {items.map((item, index) => {
        const product = item.productId || item;
        // Fallback for missing populated data
        const productName = product.name || item.name || "Unknown Item";
        const productDesc =
          product.Description || product.description || item.description || "";
        const productPrice = product.price || item.price || 0;
        const productImage = product.image || "/placeholder.png";
        const isVeg =
          product.type === "veg" ||
          productName.toLowerCase().includes("veg") ||
          false;

        return (
          <Card
            key={`${item._id || item.id}-${index}`}
            className="overflow-hidden hover:shadow-md transition-all active:scale-[0.99] border-border/50"
            onClick={() => {
              if (item.storeId) {
                router.push(`/restaurant/${item.storeId}`);
              }
            }}
          >
            <div className="flex p-3 gap-3">
              {/* Image */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
                {/* Veg/Non-veg indicator */}
                <div className="absolute top-1 left-1">
                  <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm p-0.5 rounded-sm shadow-sm">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-[1.5px] ${
                        isVeg ? "border-green-600" : "border-red-600"
                      } flex items-center justify-center`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isVeg ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                      {productName}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {productDesc}
                  </p>

                  {/* Store Name */}
                  {item.storeName && (
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      <span className="truncate">By {item.storeName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between mt-2">
                  <span className="font-bold text-sm">₹{productPrice}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs px-3 rounded-full"
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
