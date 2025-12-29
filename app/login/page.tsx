"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
        toast.success("Login successful");
        router.push("/restaurant");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-sm bg-card rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          Welcome
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium ml-1">
              Email
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="Email@Email.Com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border-input focus:ring-primary focus:border-primary h-10 px-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium ml-1">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border-input focus:ring-primary focus:border-primary h-10 px-4 pr-10 tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  // Custom Eye icon style if needed, or standard Lucide Eye which looks similar to the closed eye with lashes
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-4">
            <Button
              type="submit"
              className="w-full rounded-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-muted-foreground hover:text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
