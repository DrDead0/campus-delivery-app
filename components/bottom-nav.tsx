"use client";

import { ShoppingCart, Coffee, Calendar, User } from "lucide-react";

export type Screen = "delivery" | "vending" | "events" | "profile" | "cart";

interface BottomNavProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export function BottomNav({ activeScreen, onScreenChange }: BottomNavProps) {
  const navItems = [
    { id: "delivery" as const, label: "Delivery", icon: ShoppingCart },
    { id: "vending" as const, label: "Vending", icon: Coffee },
    { id: "events" as const, label: "Events", icon: Calendar },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border max-w-[430px] mx-auto">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "fill-primary" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
