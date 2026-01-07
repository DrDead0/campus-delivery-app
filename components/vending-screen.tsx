"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function VendingScreen() {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  // Fixed vending machine locations - Same machines for everyone
  const vendingLocations = [
    {
      id: "machine_1",
      name: "Main Lobby Vender",
      hostel: "Block A",
      location: "Ground Floor",
    },
    {
      id: "machine_2",
      name: "Canteen Vender",
      hostel: "Block B",
      location: "Canteen Area",
    },
    {
      id: "machine_3",
      name: "Library Vender",
      hostel: "Central",
      location: "Library Entrance",
    },
  ];

  // Fetch unified products from the same DB as delivery/admin system
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();

          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getAvailabilityStatus = (availability: string) => {
    if (availability === "outOfStock")
      return { status: "outOfStock", label: "✗ Out of Stock" };
    return { status: "inStock", label: "✓ Available" };
  };

  const handleOrderProduct = async (productId: string) => {
    try {
      setOrdering(true);
      toast.success("Order placed! Product dispensed.");
    } catch (err) {
      console.error("Order error:", err);
      toast.error("Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  const selectedLocation = vendingLocations.find(
    (m) => m.id === selectedMachine
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-2xl font-bold">Vending Machines</h1>
        <p className="text-xs opacity-80 mt-1">
          Same products • Instant access
        </p>
      </div>

      {/* Ad Placeholder */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-border m-4 rounded-xl p-6 text-center shadow-sm">
        <p className="text-sm font-medium">
          Same products • Fast delivery • 24/7
        </p>
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Loading machines...</p>
          </div>
        ) : !selectedMachine ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Select a Machine</h2>
              <span className="text-xs text-muted-foreground">
                {vendingLocations.length} machines
              </span>
            </div>
            {vendingLocations.map((machine, index) => (
              <Card
                key={machine.id}
                className="p-4 shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-accent animate-in fade-in-50 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedMachine(machine.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent/30 to-primary/30 rounded-xl flex items-center justify-center text-2xl">
                      🏪
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">
                        {machine.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {machine.location}, {machine.hostel}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-accent font-medium">
                        {products.length} products available
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in-50 slide-in-from-right-4">
            <button
              onClick={() => setSelectedMachine(null)}
              className="text-primary mb-4 flex items-center gap-2 hover:gap-3 transition-all font-medium active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to machines
            </button>

            <Card className="p-4 mb-4 bg-gradient-to-br from-primary/10 to-accent/10 border-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-accent/40 to-primary/40 rounded-xl flex items-center justify-center text-3xl">
                  🏪
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {selectedLocation?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    📍 {selectedLocation?.location}, {selectedLocation?.hostel}
                  </p>
                </div>
              </div>
            </Card>

            <h3 className="text-base font-bold mb-3">Available Products</h3>
            <div className="space-y-3">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No products available
                </p>
              ) : (
                products.map((product: any, index: number) => {
                  const { status, label } = getAvailabilityStatus(
                    product.availability
                  );
                  return (
                    <Card
                      key={product._id}
                      className="p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] animate-in fade-in-50 slide-in-from-right-4"
                      style={{ animationDelay: `${index * 75}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl flex items-center justify-center text-4xl shadow-sm overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>🛍️</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {product.Description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-lg text-primary">
                              ₹{product.price}
                            </span>
                            <span
                              className={`text-xs px-3 py-1.5 rounded-full font-medium shadow-sm transition-all ${status === "inStock"
                                ? "bg-success/20 text-success border border-success/30"
                                : "bg-destructive/20 text-destructive border border-destructive/30"
                                }`}
                            >
                              {label}
                            </span>
                          </div>
                        </div>
                      </div>
                      {status === "inStock" && (
                        <Button
                          size="sm"
                          className="w-full mt-3 bg-accent hover:bg-accent/90"
                          onClick={() => handleOrderProduct(product._id)}
                          disabled={ordering}
                        >
                          {ordering ? "Processing..." : "Order Now"}
                        </Button>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
