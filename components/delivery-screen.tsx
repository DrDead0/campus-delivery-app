"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Minus,
  MapPin,
  Search,
  Filter,
  X,
  ArrowLeft,
  Share2,
  Heart,
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
    type?: "veg" | "non-veg";
  }>;
  cartItems: any[]; // CartItem array
  onUpdateQuantity: (itemId: string, change: number) => void;
  onAddToCart: (item: any) => void;
  onProceedToCart: () => void;
  totals: { totalItems: number; totalPrice: number };
  selectedHostel: string;
  setSelectedHostel: (hostel: string) => void;
  roomNumber: string;
  setRoomNumber: (room: string) => void;
  store?: {
    _id?: string;
    id?: string; // Handle both
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
  onAddToCart,
  onProceedToCart,
  totals,
  store,
}: DeliveryScreenProps) {
  const router = useRouter();
  const { totalItems, totalPrice } = totals;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "limited" | "unavailable"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">(
    "name"
  );

  const [activeFilters, setActiveFilters] = useState<{
    veg: boolean;
    newArrival: boolean;
    popular: boolean;
  }>({
    veg: false,
    newArrival: false,
    popular: false,
  });

  const toggleFilter = (key: keyof typeof activeFilters) => {
    setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to find quantity
  const getQuantity = (itemId: string) => {
    const item = cartItems.find((i) => i.productId === itemId);
    return item ? item.quantity : 0;
  };

  const filteredItems = deliveryItems
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAvailability =
        availabilityFilter === "all" ||
        item.availability === availabilityFilter;

      const matchesVeg = !activeFilters.veg || item.type === "veg";

      return matchesSearch && matchesAvailability && matchesVeg;
    })
    .sort((a, b) => {
      if (activeFilters.popular) return b.price - a.price;
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  // Helper Icons for Food Type
  const VegIcon = () => (
    <div className="w-4 h-4 border border-green-500 flex items-center justify-center p-[2px] rounded-[2px] shrink-0">
      <div className="w-full h-full bg-green-500 rounded-full" />
    </div>
  );

  const NonVegIcon = () => (
    <div className="w-4 h-4 border border-red-500 flex items-center justify-center p-[2px] rounded-[2px] shrink-0">
      <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-32">
      {/* Floating Header */}
      <div className="sticky top-0 z-20 bg-[#1C45C2] backdrop-blur-md transition-all border-b border-white/5 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-background text-primary hover:bg-accent active:scale-95 transition-all shadow-md"
          >
            <ArrowLeft className="w-5 h-5 font-bold" />
          </button>

          <div className="flex gap-3">
            {/* Search Input */}
            <div className="relative group">
              <div className="relative group w-full max-w-[200px] transition-all duration-300 focus-within:max-w-[240px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <Input
                  className="rounded-full bg-background border-none pl-10 h-10 w-full focus-visible:ring-2 focus-visible:ring-ring/20 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
                  placeholder="Search in app..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Info Section */}
      <div className="relative bg-gray-900 px-4 pt-4 pb-6 isolate overflow-hidden min-h-[160px] flex flex-col justify-end">
        {/* Background Image & Gradient */}
        <div className="absolute inset-0 z-0">
          {store?.image ? (
            <img
              src={store.image}
              alt="cover"
              className="w-full h-full object-cover opacity-100 shadow"
            />
          ) : (
            <div className="w-full h-full bg-gray-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 flex justify-between items-start mt-12">
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 drop-shadow-sm">
              {store?.name || "SnackHub"}
            </h1>
            <div className="flex items-center gap-2 text-gray-300 text-sm mb-1 font-medium">
              {store?.location && (
                <>
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{store.location}</span>
                </>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-1 line-clamp-1 border-b border-dashed border-gray-600 w-fit pb-0.5">
              {store?.description ||
                "Order food delivery online from campus favorites"}
            </p>
          </div>
        </div>

        {/* Separator / Filters */}
        <div className="relative z-10 mt-6 flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white text-xs font-bold whitespace-nowrap active:bg-black/60 transition-colors shadow-lg hover:bg-black/50">
                <Filter className="w-3 h-3" /> Filter
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm rounded-xl bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle>Filter & Sort</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <Label className="text-xs uppercase text-gray-500 font-bold tracking-wider">
                    Availability
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: "all", label: "Show All" },
                      { value: "available", label: "In Stock Only" },
                      { value: "limited", label: "Limited Stock" },
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={opt.value}
                          checked={availabilityFilter === opt.value}
                          onCheckedChange={() =>
                            setAvailabilityFilter(opt.value as any)
                          }
                        />
                        <Label
                          htmlFor={opt.value}
                          className="font-normal text-foreground"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => setFilterOpen(false)}
                  className="w-full rounded-xl"
                >
                  Apply Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <button
            onClick={() => toggleFilter("newArrival")}
            className={`px-3 py-1.5 border rounded-full backdrop-blur-md shadow-sm shrink-0 whitespace-nowrap text-xs font-bold transition-all ${
              activeFilters.newArrival
                ? "bg-background border-background text-foreground"
                : "bg-black/40 border-white/20 text-white hover:bg-black/50"
            }`}
          >
            New Arrival
          </button>

          <button
            onClick={() => toggleFilter("popular")}
            className={`px-3 py-1.5 border rounded-full backdrop-blur-md shadow-sm shrink-0 whitespace-nowrap text-xs font-bold transition-all ${
              activeFilters.popular
                ? "bg-background border-background text-foreground"
                : "bg-black/40 border-white/20 text-white hover:bg-black/50"
            }`}
          >
            Popular
          </button>

          <button
            onClick={() => toggleFilter("veg")}
            className={`px-3 py-1.5 border rounded-full backdrop-blur-md shadow-sm shrink-0 whitespace-nowrap text-xs font-bold transition-all ${
              activeFilters.veg
                ? "bg-green-500 border-green-500 text-white"
                : "bg-black/40 border-white/20 text-white hover:bg-black/50"
            }`}
          >
            Veg Only
          </button>
        </div>
      </div>

      <div className="w-full h-1 bg-zinc-900/50"></div>

      {/* Recommended Section Title */}
      <div className="px-4 py-5">
        <h2 className="text-base font-extrabold tracking-widest text-foreground uppercase mb-4 flex items-center gap-2">
          Menu{" "}
          <span className="text-muted-foreground text-xs lowercase font-medium">
            ({filteredItems.length})
          </span>
        </h2>

        <div className="space-y-8">
          {filteredItems.map((item) => {
            const qty = getQuantity(item.id);
            const isUnavailable = item.availability === "unavailable";

            return (
              <div
                key={item.id}
                className="group relative flex justify-between gap-4 pb-8 border-b border-zinc-800/50 last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0 pr-1 flex flex-col h-full">
                  <div className="mb-2">
                    {item.type === "non-veg" ? <NonVegIcon /> : <VegIcon />}
                  </div>
                  <h3 className="text-[17px] font-bold text-foreground leading-tight mb-1">
                    {item.name}
                  </h3>
                  <div className="text-sm font-medium text-foreground mb-2">
                    ₹{item.price}
                  </div>

                  <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed font-medium mt-1">
                    {item.description}
                  </p>

                  <div className="mt-4 flex gap-4">
                    {/* in future if adding a wishlist button add here */}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof window !== "undefined") {
                          const url = window.location.href;
                          if (navigator.share) {
                            navigator
                              .share({ title: item.name, url })
                              .catch(() => {});
                          } else {
                            navigator.clipboard.writeText(url);
                            alert("Link copied to clipboard!");
                          }
                        }
                      }}
                      className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative shrink-0 w-[140px] h-[130px]">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-zinc-900 relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-zinc-800 text-zinc-600">
                        {item.emoji || "🍽️"}
                      </div>
                    )}
                    {isUnavailable && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-zinc-300 border border-zinc-600/50 px-2 py-1 rounded bg-zinc-900/50">
                          Next time
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Floating ADD Button */}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-[110px] shadow-xl z-10">
                    {!isUnavailable ? (
                      qty === 0 ? (
                        <button
                          onClick={() => onAddToCart(item)}
                          className="w-full bg-primary text-primary-foreground font-extrabold text-sm py-2.5 rounded-xl  uppercase tracking-wider shadow-lg flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-primary rounded-xl h-[38px] overflow-hidden shadow-lg">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-9 h-full flex items-center justify-center text-white "
                          >
                            <Minus className="w-3.5 h-3.5 font-bold" />
                          </button>
                          <span className="text-sm font-bold text-primary-foreground tabular-nums">
                            {qty}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-9 h-full flex items-center justify-center text-white"
                          >
                            <Plus className="w-3.5 h-3.5 font-bold" />
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="w-full bg-muted text-muted-foreground font-bold text-xs py-2 rounded-xl border border-border text-center">
                        Unavailable
                      </div>
                    )}
                  </div>
                  {isUnavailable ? null : (
                    <div className="text-[9px] text-zinc-500 text-center mt-4 w-full">
                      customisable
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
