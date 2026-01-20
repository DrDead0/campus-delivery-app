"use client";

import { useCart } from "@/app/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createOrder, verifyPayment } from "@/app/actions/order-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { hostels } from "@/lib/data";
import { CreditCard, Banknote, Loader2 } from "lucide-react";
import { CartHeader } from "@/components/cart/cart-header";
import { CartItemsList } from "@/components/cart/cart-items";
import { DeliveryDetails } from "@/components/cart/delivery-details";
import { BillDetails } from "@/components/cart/bill-details";

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
  const handlingFee = 5;
  // GST = 2% of (Item Total + Handling)
  const taxableAmount = itemTotal + handlingFee;
  const gst = Math.round(taxableAmount * 0.02);

  // Delivery Fee Logic (User: >100 Free, else ? Let's keep existing or simplified)
  const deliveryFee = itemTotal > 100 ? 0 : 5;

  // const grandTotal = itemTotal + handlingFee + gst + deliveryFee;
  const grandTotal = itemTotal + gst + deliveryFee;
  const handlePlaceOrder = async () => {
    if (!selectedHostel || !roomNumber) {
      toast.error("Please provide your complete delivery address.");
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
        address: selectedHostel,
        roomNumber: roomNumber,
      });

      if (result.success) {
        if (paymentMethod === "ONLINE" && result.razorpayOrder?.id) {
          const options = {
            key:
              process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
            amount: grandTotal * 100,
            currency: "INR",
            name: "Unigo Campus Delivery",
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

  const hasAddress = !!(selectedHostel && roomNumber);

  return (
    <div className="bg-background min-h-screen pb-20">
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />

      <CartHeader onBack={() => router.back()} userName={userName} />

      <div className="p-4 space-y-6 max-w-2xl mx-auto -mt-2">
        <CartItemsList
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
        />

        {cartItems.length > 0 && (
          <DeliveryDetails
            selectedHostel={selectedHostel}
            onHostelChange={setSelectedHostel}
            roomNumber={roomNumber}
            onRoomChange={setRoomNumber}
            hasAddress={hasAddress}
          />
        )}

        {cartItems.length > 0 && (
          <BillDetails
            totals={{ totalPrice: itemTotal }}
            gst={gst}
            handlingFee={handlingFee}
            deliveryFee={deliveryFee}
            grandTotal={grandTotal}
          />
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
