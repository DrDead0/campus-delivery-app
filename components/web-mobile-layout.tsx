"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WebMobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function WebMobileLayout({ children, className }: WebMobileLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background md:bg-zinc-50/50 md:flex md:items-center md:justify-center">
      <div
        className={cn(
          "w-full min-h-screen bg-background relative flex flex-col",
          // Desktop specific styles to mimic mobile device
          "md:min-h-0 md:h-screen md:w-[400px] md:rounded-[16px] md:border-[1px] md:border-zinc-800 md:shadow-2xl md:overflow-hidden md:[transform:translateZ(0)]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
