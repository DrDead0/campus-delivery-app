"use client";

import { Card } from "@/components/ui/card";

interface BillDetailsProps {
  totals: {
    totalPrice: number;
  };
  gst: number;
  handlingFee: number;
  deliveryFee: number;
  grandTotal: number;
}

export function BillDetails({
  totals,
  gst,
  handlingFee,
  deliveryFee,
  grandTotal,
}: BillDetailsProps) {
  return (
    <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 delay-200">
      <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
        Bill Summary
      </h2>
      <Card className="p-5 space-y-3 text-sm shadow-sm border-border rounded-2xl bg-card">
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">Item Total</span>
          <span className="font-bold text-foreground">
            ₹{totals.totalPrice}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">
            Handling Charge
          </span>
          <span className="font-bold text-foreground">₹{handlingFee}</span>
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
  );
}
