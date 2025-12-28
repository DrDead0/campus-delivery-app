"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/restaurant");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between py-20 px-4 max-w-[480px] mx-auto relative overflow-hidden">
      {/* Spacer for visual balance similar to image */}
      <div className="flex-1" />

      <div className="flex flex-col items-center text-center space-y-8 z-10">
        <h1
          className="text-primary text-5xl sm:text-3xl lg:text-[72px] leading-tight lg:leading-[1.05] font-extrabold m-0 text-inner-shadow "
          style={{
            letterSpacing: "-2px",
          }}
        >
          Snack Hub
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <p className="text-primary/80 text-xl font-medium">
          put your slogn here
        </p>
      </div>

      <div className="w-full z-10 mb-10">
        <Button
          onClick={handleGetStarted}
          className="w-full rounded-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
        >
          Start Ordering
        </Button>
      </div>
    </div>
  );
}
