"use client";

import { useState, type ElementType } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Minus,
  ShoppingCart,
  MapPin,
  Search,
  Filter,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { hostels } from "@/lib/data";

interface DeliveryScreenProps {
  deliveryItems: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    availability: "available" | "limited" | "unavailable";
    emoji?: string;
    icon?: any;
    image?: string;
  }>;
  cartItems: Record<string, number>;
  onUpdateQuantity: (itemId: string, change: number) => void;
  onProceedToCart: () => void;
  totals: { totalItems: number; totalPrice: number };
  selectedHostel: string;
  setSelectedHostel: (hostel: string) => void;
  roomNumber: string;
  setRoomNumber: (room: string) => void;
  store?: {
    name: string;
    image?: string;
    description?: string;
    location?: string;
  };
}

export function DeliveryScreen({
  deliveryItems,
  cartItems,
  onUpdateQuantity,
  onProceedToCart,
  totals,
  selectedHostel,
  setSelectedHostel,
  roomNumber,
  setRoomNumber,
  store,
}: DeliveryScreenProps) {
  const { totalItems, totalPrice } = totals;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "limited" | "unavailable"
  >("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">(
    "name"
  );

  // Filter and sort items
  const filteredItems = deliveryItems
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAvailability =
        availabilityFilter === "all" ||
        item.availability === availabilityFilter;
      const matchesPrice = maxPrice === null || item.price <= maxPrice;
      return matchesSearch && matchesAvailability && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header Logic: Store Header vs Default Header */}
      {store ? (
        // Store Header
        <div className="bg-background sticky top-0 z-10 shadow-sm border-b">
          <div className="relative h-48 w-full overflow-hidden">
            {store.image ? (
              <img
                src={store.image}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">
                🏪
              </div>
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl font-bold">{store.name}</h1>
              <p className="opacity-90 text-sm">{store.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-green-600 px-1.5 rounded-sm text-xs font-bold flex items-center gap-0.5">
                  4.2 <span>★</span>
                </div>
                <span className="text-xs opacity-80">
                  • 25-30 mins • {store.location}
                </span>
              </div>
            </div>
          </div>

          {/* Cart & Back Button (Overlay or separate?) - For now let's keep cart consistent */}
          <div className="absolute top-4 right-4">
            <button
              onClick={onProceedToCart}
              className="relative cursor-pointer hover:scale-110 transition-transform bg-white/20 p-2 rounded-full backdrop-blur-md"
            >
              <ShoppingCart
                className={`w-6 h-6 text-white ${
                  totalItems > 0 ? "animate-pulse" : ""
                }`}
              />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Default Header (SnackHub) - Only shown if NOT in store context
        <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold">SnackHub</h1>
              <p className="text-xs opacity-80">
                Snacks delivered to your room
              </p>
            </div>
            <button
              onClick={onProceedToCart}
              className="relative cursor-pointer hover:scale-110 transition-transform"
            >
              <ShoppingCart
                className={`w-6 h-6 ${totalItems > 0 ? "animate-pulse" : ""}`}
              />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-in zoom-in-50">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Location Display */}
          <div className="bg-primary-foreground/10 rounded-xl p-3 space-y-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <MapPin className="w-4 h-4" />
              <span>Delivery Address</span>
            </div>
            {selectedHostel && roomNumber ? (
              <p className="text-sm font-semibold animate-in fade-in-50 slide-in-from-top-2">
                📍 Room {roomNumber}, {selectedHostel}
              </p>
            ) : (
              <p className="text-sm text-white italic">Select address</p>
            )}
          </div>
        </div>
      )}

      {/* Ad Placeholder (Show in both? Maybe only default?) */}
      {!store && (
        <div className="bg-linear-to-r from-accent/20 to-primary/20 border border-border m-4 rounded-xl p-6 text-center shadow-sm">
          <p className="text-sm font-medium">
            Special Offer: Free delivery on orders above ₹100
          </p>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={
                store ? `Search in ${store.name}...` : "Search snacks..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-2 border-border focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl border-2 hover:bg-accent hover:text-accent-foreground hover:border-accent"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
              <DialogHeader>
                <DialogTitle>Filter & Sort</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Availability Filter */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Availability
                  </Label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Items" },
                      { value: "available", label: "✓ Available" },
                      { value: "limited", label: "⚠ Limited Stock" },
                      { value: "unavailable", label: "✗ Out of Stock" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={option.value}
                          checked={availabilityFilter === option.value}
                          onCheckedChange={() =>
                            setAvailabilityFilter(
                              option.value as
                                | "all"
                                | "available"
                                | "limited"
                                | "unavailable"
                            )
                          }
                          className="rounded-md border-2"
                        />
                        <Label
                          htmlFor={option.value}
                          className="font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price Range Filter */}
                <div>
                  <Label
                    htmlFor="price-range"
                    className="text-base font-semibold mb-3 block"
                  >
                    Max Price: ₹{maxPrice ?? "∞"}
                  </Label>
                  <input
                    id="price-range"
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={maxPrice ?? 500}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
                    title="Adjust maximum price filter"
                    aria-label="Maximum price filter"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMaxPrice(null)}
                    className="mt-2 text-xs"
                  >
                    Clear Price Filter
                  </Button>
                </div>

                <Separator />

                {/* Sort Options */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Sort By
                  </Label>
                  <div className="space-y-2">
                    {[
                      { value: "name", label: "Name (A-Z)" },
                      { value: "price-asc", label: "Price (Low to High)" },
                      { value: "price-desc", label: "Price (High to Low)" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={option.value}
                          checked={sortBy === option.value}
                          onCheckedChange={() =>
                            setSortBy(
                              option.value as
                                | "name"
                                | "price-asc"
                                | "price-desc"
                            )
                          }
                          className="rounded-md border-2"
                        />
                        <Label
                          htmlFor={option.value}
                          className="font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setFilterOpen(false)}
                  className="w-full rounded-xl"
                >
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || availabilityFilter !== "all" || maxPrice !== null) && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:text-primary/70"
                  title="Clear search filter"
                  aria-label="Clear search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {availabilityFilter !== "all" && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                {availabilityFilter === "available"
                  ? "Available"
                  : availabilityFilter === "limited"
                  ? "Limited"
                  : "Out of Stock"}
                <button
                  onClick={() => setAvailabilityFilter("all")}
                  className="hover:text-primary/70"
                  title="Clear availability filter"
                  aria-label="Clear availability filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {maxPrice !== null && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                Max ₹{maxPrice}
                <button
                  onClick={() => setMaxPrice(null)}
                  className="hover:text-primary/70"
                  title="Clear price filter"
                  aria-label="Clear price filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="px-4 pb-24 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Packaged Snacks</h2>
          <span className="text-xs text-muted-foreground">
            {filteredItems.length} of {deliveryItems.length} items
          </span>
        </div>
        {filteredItems.length === 0 ? (
          <Card className="p-8 text-center rounded-xl">
            <p className="text-muted-foreground mb-2">No items found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          filteredItems.map((item, index) => (
            <Card
              key={item.id}
              className="p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] animate-in fade-in-50 slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 bg-linear-to-br from-accent/20 to-primary/20 rounded-xl flex items-center justify-center text-4xl shadow-sm overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : item.icon ? (
                    <item.icon className="w-10 h-10 text-primary" />
                  ) : (
                    <span>{item.emoji}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-primary">
                      ₹{item.price}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${
                        item.availability === "available"
                          ? "bg-success/20 text-success border border-success/30"
                          : item.availability === "limited"
                          ? "bg-warning/20 text-warning border border-warning/30"
                          : "bg-destructive/20 text-destructive border border-destructive/30"
                      }`}
                    >
                      {item.availability === "available"
                        ? "✓ Available"
                        : item.availability === "limited"
                        ? "⚠ Limited"
                        : "✗ Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>
              {item.availability !== "unavailable" && (
                <div className="mt-3 flex items-center justify-end">
                  {(cartItems[item.id] || 0) === 0 ? (
                    <Button
                      size="sm"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                    >
                      Add to Cart
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 bg-accent rounded-xl px-4 py-2 shadow-md animate-in zoom-in-90">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="text-accent-foreground hover:scale-110 transition-transform active:scale-95"
                        title="Decrease quantity"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="font-bold text-accent-foreground w-6 text-center text-lg">
                        {cartItems[item.id]}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="text-accent-foreground hover:scale-110 transition-transform active:scale-95"
                        title="Increase quantity"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 animate-in slide-in-from-bottom-4">
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 rounded-xl shadow-lg font-bold text-lg flex items-center justify-between hover:scale-[1.02] transition-all active:scale-95"
            onClick={onProceedToCart}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{totalItems} items</span>
            </div>
            <span>Proceed • ₹{totalPrice}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
