"use client";

import { useCart } from "@/app/context/CartContext";
import { ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function GlobalCartFooter() {
  const { totals } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, totalPrice } = totals;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (
    totalItems === 0 ||
    pathname === "/restaurant/cart" ||
    pathname?.startsWith("/restaurant/profile")
  )
    return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div
        onClick={() => router.push("/restaurant/cart")}
        className="bg-primary max-w-[480px] text-primary-foreground rounded-xl shadow-2xl p-3.5 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all max-w-2xl mx-auto ring-1 ring-white/10"
      >
        <div className="flex flex-col pl-1">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {totalItems} ITEM{totalItems > 1 ? "S" : ""} ADDED
          </span>
          <span className="text-base font-extrabold">
            ₹{totalPrice}{" "}
            <span className="text-xs font-medium opacity-70 ml-1">
              plus taxes
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 pr-1">
          <span className="text-sm font-bold tracking-wide">Next</span>
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </div>
      </div>
    </div>
  );
}
