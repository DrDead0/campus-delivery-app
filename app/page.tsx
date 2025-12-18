"use client";

import { useMemo, useState, useEffect } from "react";
import { DeliveryScreen } from "@/components/delivery-screen";
import { VendingScreen } from "@/components/vending-screen";
import { EventsScreen } from "@/components/events-screen";
import { BottomNav, type Screen } from "@/components/bottom-nav";
import { CartScreen } from "@/components/cart-screen";
import { StoreList } from "@/components/store-list";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Mic, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hostels, categories } from "@/lib/data";

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<Screen>("delivery");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [selectedHostel, setSelectedHostel] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [activeStore, setActiveStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [tempHostel, setTempHostel] = useState("");
  const [tempRoom, setTempRoom] = useState("");

  const handleSaveAddress = () => {
    setSelectedHostel(tempHostel);
    setRoomNumber(tempRoom);
    setIsAddressDialogOpen(false);
  };

  const handleOpenAddressDialog = () => {
    setTempHostel(selectedHostel);
    setTempRoom(roomNumber);
    setIsAddressDialogOpen(true);
  };

  const filteredStores = useMemo(() => {
    if (!searchQuery) return stores;
    const lower = searchQuery.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.description?.toLowerCase().includes(lower) ||
        s.location?.toLowerCase().includes(lower)
    );
  }, [stores, searchQuery]);

  // Fetch stores and user profile from DB on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        console.log("Fetching stores from /api/stores...");
        const res = await fetch("/api/stores");
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched stores:", data);
          setStores(data);
        } else {
          console.error("API returned status:", res.status);
        }
      } catch (err) {
        console.error("Failed to fetch stores:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.address) {
            setSelectedHostel(data.address);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchStores();
    fetchProfile();
  }, []);

  const updateQuantity = (itemId: string, change: number) => {
    setCartItems((prev) => {
      const current = prev[itemId] || 0;
      const nextQty = Math.max(0, current + change);
      if (nextQty === 0) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: nextQty };
    });
  };

  const deliveryItems = useMemo(() => {
    if (!activeStore) return [];
    return activeStore.items.map((item: any) => ({
      id: item.productId._id,
      name: item.productId.name,
      description: item.productId.Description,
      price: item.price || item.productId.price,
      availability:
        (item.availability || item.productId.availability) === "outOfStock"
          ? "unavailable"
          : "available",
      icon: ShoppingCart,
      image: item.productId.image,
    }));
  }, [activeStore]);

  const totals = useMemo(() => {
    const totalItems = Object.values(cartItems).reduce(
      (sum, qty) => sum + qty,
      0
    );
    // Simple total estimate based on current store.
    // In a real app we'd need a map of ALL products to prices.
    // For now assuming items in cart belong to current store context or just price summing if we had a map.
    // Since we don't have a global price map easily here, we'll try to sum based on available delivery items + approximation.
    // Actually, let's create a temporary map from ALL stores for accuracy if possible.
    const priceMap: Record<string, number> = {};
    stores.forEach((s) => {
      s.items?.forEach((i: any) => {
        if (i.productId) {
          priceMap[i.productId._id] = i.price || i.productId.price;
        }
      });
    });

    const totalPrice = Object.entries(cartItems).reduce((sum, [id, qty]) => {
      const price = priceMap[id] || 0;
      return sum + qty * price;
    }, 0);

    return { totalItems, totalPrice };
  }, [cartItems, stores]);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-[480px] mx-auto overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {activeScreen === "delivery" && (
            <>
              {!activeStore ? (
                <>
                  {/* Header */}
                  {/* SnackHub Header (Image 0 Style) */}
                  <div className="bg-primary text-primary-foreground p-4 pb-6 rounded-b-[2rem] shadow-md relative overflow-hidden">
                    {/* Decorative background circle */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div>
                        <h1 className="text-2xl font-bold">SnackHub</h1>
                        <p className="text-xs opacity-80">
                          Snacks delivered to your room
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary-foreground hover:bg-white/20"
                        onClick={() => setActiveScreen("cart")}
                      >
                        <div className="relative">
                          <ShoppingCart className="w-6 h-6" />
                          {totals.totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {totals.totalItems}
                            </span>
                          )}
                        </div>
                      </Button>
                    </div>

                    {/* Delivery Address Card */}
                    <Dialog
                      open={isAddressDialogOpen}
                      onOpenChange={setIsAddressDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 relative z-10 cursor-pointer hover:bg-white/20 transition-all active:scale-[0.98]">
                          <div className="flex items-center gap-2 mb-1 opacity-90">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Delivery Address
                            </span>
                          </div>
                          <div
                            className="flex items-center justify-between"
                            onClick={handleOpenAddressDialog}
                          >
                            {selectedHostel ? (
                              <span className="font-bold text-lg truncate">
                                {roomNumber ? `Room ${roomNumber}, ` : ""}{selectedHostel}
                              </span>
                            ) : (
                              <span className="font-bold text-lg italic opacity-70">
                                Select address
                              </span>
                            )}
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                              Change
                            </span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Select Delivery Address</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="hostel">Hostel</Label>
                            <Select
                              value={tempHostel}
                              onValueChange={setTempHostel}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select hostel" />
                              </SelectTrigger>
                              <SelectContent>
                                {hostels.map((hostel) => (
                                  <SelectItem key={hostel} value={hostel}>
                                    {hostel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="room">Room Number</Label>
                            <Input
                              id="room"
                              value={tempRoom}
                              onChange={(e) => setTempRoom(e.target.value)}
                              placeholder="e.g. 302"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsAddressDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" onClick={handleSaveAddress}>
                            Save Address
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Special Offer Banner (Green from Image 0) */}
                  <div className="px-4 mt-4">
                    <div className="bg-green-100 border border-green-200 rounded-xl p-3 flex items-center justify-center text-center shadow-sm">
                      <p className="text-green-800 text-sm font-medium">
                        Special Offer: Free delivery on orders above ₹100
                      </p>
                    </div>
                  </div>

                  {/* "What's on your mind?" Categories */}
                  {!searchQuery && (
                    <div className="mt-6 px-4">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold tracking-wide uppercase text-muted-foreground/80">
                          That craving?
                        </h3>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x transition-opacity duration-300">
                        {categories.map((cat) => (
                          <div
                            key={cat.name}
                            className="flex flex-col items-center gap-2 min-w-[70px] snap-center cursor-pointer hover:scale-105 transition-transform"
                          >
                            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center shadow-sm border border-border/50 overflow-hidden">
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs font-semibold text-foreground/80">
                              {cat.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/30 pt-2 min-h-[500px] rounded-t-[2rem]">
                    <StoreList
                      stores={filteredStores}
                      onSelectStore={(store) => setActiveStore(store)}
                    />
                  </div>
                </>
              ) : (
                <div className="relative">
                  <div className="absolute top-4 left-4 z-20">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveStore(null)}
                      className="rounded-full h-8 w-8 p-0 shadow-md bg-white/80 backdrop-blur-md"
                    >
                      ←
                    </Button>
                  </div>
                  <DeliveryScreen
                    deliveryItems={deliveryItems}
                    cartItems={cartItems}
                    onUpdateQuantity={updateQuantity}
                    onProceedToCart={() => setActiveScreen("cart")}
                    totals={totals}
                    selectedHostel={selectedHostel}
                    setSelectedHostel={setSelectedHostel}
                    roomNumber={roomNumber}
                    setRoomNumber={setRoomNumber}
                    store={activeStore}
                  />
                </div>
              )}
            </>
          )}
          {activeScreen === "vending" && <VendingScreen />}
          {activeScreen === "events" && <EventsScreen />}
          {activeScreen === "cart" && (
            <CartScreen
              cartItems={cartItems}
              onUpdateQuantity={updateQuantity}
              totals={totals}
              onGoToDelivery={() => setActiveScreen("delivery")}
              selectedHostel={selectedHostel}
              setSelectedHostel={setSelectedHostel}
              roomNumber={roomNumber}
              setRoomNumber={setRoomNumber}
            />
          )}

          <BottomNav
            activeScreen={activeScreen}
            onScreenChange={(screen) => {
              if (screen === "delivery") setActiveStore(null); // Reset when tapping home
              setActiveScreen(screen);
            }}
          />
        </>
      )}
    </div>
  );
}
