"use client";

import { useMemo, useState, useEffect } from "react";
import { StoreList } from "@/components/store-list";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { useCart } from "@/components/cart-context";
import { useRouter } from "next/navigation";
import { getStoresAction } from "./actions";
import { ModeToggle } from "@/components/mode-toggle";

interface RestaurantClientProps {
  initialStores: any[];
}

export default function RestaurantClient({
  initialStores,
}: RestaurantClientProps) {
  const router = useRouter();
  const {
    selectedHostel,
    roomNumber,
    setSelectedHostel,
    setRoomNumber,
    totals,
  } = useCart();

  const [stores, setStores] = useState<any[]>(initialStores);
  const [loading, setLoading] = useState(false); // Initial data provided
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [tempHostel, setTempHostel] = useState("");
  const [tempRoom, setTempRoom] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleSaveAddress = async () => {
    setSelectedHostel(tempHostel);
    setRoomNumber(tempRoom);
    setIsAddressDialogOpen(false);

    // Save to DB
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch("/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address: tempHostel,
            roomNumber: tempRoom,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
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

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const storesData = await getStoresAction(Date.now());

        const formattedStores = [
          ...storesData.map((s: any) => ({ ...s, isVending: false })),
        ];

        setStores(formattedStores);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to fetch content:", err);
      }
    };

    // Initial fetch not needed as we passing props but interval is needed
    const interval = setInterval(fetchContent, 1000); // 1s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-background pb-20 max-w-[480px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-6 rounded-b-[1rem] shadow-md relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h1 className="text-2xl font-bold">SnackHub</h1>
            <p className="text-xs opacity-80">Snacks delivered to your room</p>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle className="bg-transparent border-none text-primary-foreground hover:bg-white/20 focus-visible:ring-0 focus-visible:offset-0" />
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/20"
              onClick={() => {
                if (!localStorage.getItem("token")) {
                  alert("Please login to view cart and order.");
                  return;
                }
                // Navigate to cart
                router.push("/restaurant/cart");
              }}
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
        </div>

        {/* Delivery Address Card */}
        <Dialog
          open={isAddressDialogOpen}
          onOpenChange={setIsAddressDialogOpen}
        >
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-full text-left bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 relative z-10 cursor-pointer hover:bg-white/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Delivery Address</span>
              </div>
              <div
                className="flex items-center justify-between"
                onClick={(e) => {
                  e.stopPropagation(); // prevent double trigger if parent is listening
                  handleOpenAddressDialog();
                }}
              >
                {selectedHostel ? (
                  <span className="font-bold text-lg truncate">
                    {roomNumber ? `Room ${roomNumber}, ` : ""}
                    {selectedHostel}
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
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Select Delivery Address</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="hostel">Hostel</Label>
                <Select value={tempHostel} onValueChange={setTempHostel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.map((hostel: any) => (
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

      {/* Special Offer Banner */}
      <div className="px-4 mt-4">
        <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl p-3 flex items-center justify-center text-center shadow-sm">
          <p className="text-green-800 dark:text-green-300 text-sm font-medium">
            Special Offer: Free delivery on orders above ₹100
          </p>
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold tracking-wide uppercase text-muted-foreground/80">
              That craving?
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x transition-opacity duration-300">
            {categories.map((cat: any) => (
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
          onSelectStore={(store: any) => {
            // Push to new route
            if (store.isVending) {
              router.push(`/restaurant/vending/${store.id}`);
            } else {
              router.push(`/restaurant/${store.id}`);
            }
          }}
        />
      </div>
    </div>
  );
}
