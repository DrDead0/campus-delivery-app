"use client";

import { useCart } from "@/app/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createOrder, verifyPayment } from "@/app/actions/order-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hostels } from "@/lib/data";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  MapPin,
  CreditCard,
  Banknote,
  Loader2,
  Pencil,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CartClient() {
  const router = useRouter();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totals,
    selectedHostel,
    setSelectedHostel,
    roomNumber,
    setRoomNumber,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        const user = JSON.parse(jsonPayload);
        if (user.name) setUserName(user.name);

        // Fetch address if missing - Force Dynamic
        fetch(`/api/auth/profile?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
          .then((res) => res.json())
          .then((data) => {
            // Smart mapping: Handle legacy or mixed data
            let hostelToSet = "";
            let roomToSet = "";

            // Check if 'address' field matches a known hostel
            if (data.address && hostels.includes(data.address)) {
              hostelToSet = data.address;
            } else if (data.address) {
              // If address is not a hostel name, assume it's the room/location
              roomToSet = data.address;
            }

            // Explit roomNumber field overrides mapped room
            if (data.roomNumber) {
              roomToSet = data.roomNumber;
            }

            // Apply if current state is empty
            if (hostelToSet && !selectedHostel) setSelectedHostel(hostelToSet);
            if (roomToSet && !roomNumber) setRoomNumber(roomToSet);
          })
          .catch((err) => console.error("Failed to fetch address:", err));
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, [selectedHostel, roomNumber, setSelectedHostel, setRoomNumber]);

  const itemTotal = totals.totalPrice;
  const handlingFee = 20;
  // GST = 18% of (Item Total + Handling)
  const taxableAmount = itemTotal + handlingFee;
  const gst = Math.round(taxableAmount * 0.18);

  // Delivery Fee Logic (User: >100 Free, else ? Let's keep existing or simplified)
  // Re-reading user request: "gst = (total price + handling charge) not delivery fee"
  // doesn't explicitly specify delivery fee logic change, so keeping existing >100 rule.
  const deliveryFee = itemTotal > 100 ? 0 : 20;

  const grandTotal = itemTotal + handlingFee + gst + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!selectedHostel || !roomNumber) {
      toast.error("Please provide your complete delivery address.");
      setIsEditingAddress(true);
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const address = `${roomNumber}, ${selectedHostel}`;

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to place an order.");
        router.push("/login");
        return;
      }

      let userId;
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        const user = JSON.parse(jsonPayload);
        userId = user.userId || user.id;
      } catch (e) {
        console.error("Token decode failed", e);
        toast.error("Session invalid. Please login again.");
        return;
      }

      const result = await createOrder({
        userId,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          source: item.source,
          sourceId: item.sourceId,
          sourceModel: item.sourceModel,
          itemModel: item.source === "STORE" ? "Product" : "VendingItem",
        })),
        totalAmount: grandTotal,
        paymentMethod,
        address,
      });

      if (result.success) {
        if (paymentMethod === "ONLINE" && result.razorpayOrder?.id) {
          const options = {
            key:
              process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
            amount: grandTotal * 100,
            currency: "INR",
            name: "SnackHub Campus Delivery",
            description: "Order Payment",
            order_id: result.razorpayOrder.id,
            handler: async function (response: any) {
              const verify = await verifyPayment({
                orderId: result.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              if (verify.success) {
                toast.success("Payment successful! Order placed.");
                clearCart();
                router.push("/restaurant/profile");
              } else {
                toast.error("Payment verification failed.");
              }
            },
            prefill: {
              name: "Student", // Could fetch from profile if needed
              contact: "",
            },
            theme: {
              color: "#3399cc",
            },
          };
          const rzp1 = new window.Razorpay(options);
          rzp1.open();
        } else {
          // COD
          toast.success("Order placed successfully!");
          clearCart();
          router.push("/restaurant/profile");
        }
      } else {
        toast.error("Failed to create order: " + result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  const fullAddress = `${roomNumber}, ${selectedHostel}`;
  const hasAddress = selectedHostel && roomNumber;

  return (
    <div className="bg-background min-h-screen pb-20">
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-primary backdrop-blur-md transition-all shadow-sm border-b border-primary-foreground/5">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-background text-primary hover:bg-accent active:scale-95 transition-all shadow-md"
            >
              <ArrowLeft className="w-5 h-5 font-bold" />
            </button>
            <h1 className="text-xl font-bold text-primary-foreground tracking-tight">
              Checkout
            </h1>
          </div>
          {userName && (
            <span className="text-xs font-semibold bg-primary-foreground/10 text-primary-foreground px-3 py-1.5 rounded-full backdrop-blur-sm border border-primary-foreground/10">
              {userName}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto -mt-2">
        {/* Cart Items */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            Order Summary
            <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {cartItems.length} items
            </span>
          </h2>

          {cartItems.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed bg-muted/50">
              Your cart is empty, Or refresh the page
              <Button
                variant="link"
                onClick={() => router.push("/restaurant")}
                className="mt-2 text-primary"
              >
                Browse Snacks
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
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
                      {item.source === "STORE"
                        ? "Store Item"
                        : "Vending Machine"}
                    </p>
                    <div className="font-bold text-primary">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Delete Button */}
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-muted border border-border p-1.5 rounded-xl">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-background rounded-lg shadow-sm border border-border hover:bg-muted active:scale-95 transition-all text-muted-foreground"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
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

        {/* Delivery Address */}
        {cartItems.length > 0 && (
          <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 delay-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                Delivery Address
              </h2>
              {/* If viewing, show Edit button */}
              {!isEditingAddress && hasAddress && (
                <button
                  onClick={() => setIsEditingAddress(true)}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            <Card className="p-5 shadow-sm border-border rounded-2xl bg-card">
              {isEditingAddress || !hasAddress ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-bold uppercase">
                      Select Hostel / Building
                    </Label>
                    <Select
                      value={selectedHostel}
                      onValueChange={setSelectedHostel}
                    >
                      <SelectTrigger className="rounded-xl border-border bg-muted/50 h-10">
                        <SelectValue placeholder="Select Hostel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostels.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-bold uppercase">
                      Room Number
                    </Label>
                    <Input
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 304, Block A"
                      className="rounded-xl border-border bg-muted/50 h-10"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (selectedHostel && roomNumber)
                        setIsEditingAddress(false);
                      else toast.error("Please fill all fields");
                    }}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl"
                  >
                    Save Address
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground line-clamp-1">
                      {roomNumber}, {selectedHostel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Campus Delivery
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Bill Details */}
        {cartItems.length > 0 && (
          <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 delay-200">
            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
              Bill Summary
            </h2>
            <Card className="p-5 space-y-3 text-sm shadow-sm border-border rounded-2xl bg-card">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">
                  Item Total
                </span>
                <span className="font-bold text-foreground">₹{itemTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">
                  Handling Charge
                </span>
                <span className="font-bold text-foreground">
                  ₹{handlingFee}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Tax</span>
                <span className="font-serif text-xs text-muted-foreground self-center mx-1 flex-1 border-b border-dashed border-border relative -top-1"></span>
                <span className="font-bold text-foreground">₹{gst}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">
                  Delivery Fee
                </span>
                <span
                  className={
                    deliveryFee === 0
                      ? "text-green-600 font-bold"
                      : "font-bold text-foreground"
                  }
                >
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="border-t border-dashed border-border pt-3 mt-1 flex justify-between">
                <span className="font-extrabold text-base text-foreground">
                  Grand Total
                </span>
                <span className="font-extrabold text-base text-primary">
                  ₹{grandTotal}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Payment Method */}
        {cartItems.length > 0 && (
          <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 delay-300">
            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
              Payment Method
            </h2>
            <Card className="p-4 shadow-sm border-border rounded-2xl overflow-hidden">
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v: any) => setPaymentMethod(v)}
                className="gap-3"
              >
                <div
                  className={`flex items-center space-x-3 border-2 p-4 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "COD"
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <RadioGroupItem
                    value="COD"
                    id="cod"
                    className="border-primary text-primary"
                  />
                  <Label
                    htmlFor="cod"
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-base">
                        Pay on Delivery
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Cash or UPI at door
                      </div>
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex items-center space-x-3 border-2 p-4 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "ONLINE"
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => setPaymentMethod("ONLINE")}
                >
                  <RadioGroupItem
                    value="ONLINE"
                    id="online"
                    className="border-primary text-primary"
                  />
                  <Label
                    htmlFor="online"
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-base">
                        Pay Online
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Cards, UPI, Netbanking
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-card border-t border-border p-4 pb-20 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-20">
          <div className="flex items-center justify-between gap-4 ">
            <div className="flex flex-col">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total to Pay
              </p>
              <p className="text-2xl font-extrabold text-primary">
                ₹{grandTotal}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handlePlaceOrder}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 rounded-xl font-bold text-base shadow-xl disabled:opacity-70 flex-1 max-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Place Order</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
