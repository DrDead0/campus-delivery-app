"use client";

import { ArrowLeft } from "lucide-react";

interface CartHeaderProps {
  onBack: () => void;
  userName?: string;
}

export function CartHeader({ onBack, userName }: CartHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-primary backdrop-blur-md transition-all shadow-sm border-b border-primary-foreground/5">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
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
  );
}
