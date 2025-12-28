"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hostels } from "@/lib/data";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Flag icon (simple representation)
  const FlagIndia = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      className="w-6 h-4 object-cover rounded-sm"
    >
      <g fillRule="evenodd" strokeWidth="1pt">
        <path fill="#f93" d="M0 0h640v160H0z" />
        <path fill="#fff" d="M0 160h640v160H0z" />
        <path fill="#128807" d="M0 320h640v160H0z" />
      </g>
      <g transform="translate(320 240) scale(6.4)">
        <circle r="12" fill="#008" />
        <circle r="9" fill="#fff" />
        <path
          fill="#008"
          d="M0-12A12 12 0 0 1 0 12A12 12 0 0 1 0-12 M0-9A9 9 0 0 1 0 9A9 9 0 0 1 0-9M0-2l-1 11h2l-1-11z"
        />
        <circle r="2" fill="#008" />
      </g>
    </svg>
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Mapping address to hostel selection for backend consistency
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          roomNumber,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
        toast.success("Account created successfully!");

        // Immediate redirect
        setTimeout(() => {
          window.location.href = "/";
        }, 800);
      } else {
        toast.error(data.error || "Registration failed");
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
        <h1 className="text-3xl font-bold text-center mb-6 text-foreground">
          Create Account
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium ml-1">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border-input focus:ring-primary focus:border-primary h-10 px-4"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium ml-1">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border-input focus:ring-primary focus:border-primary h-10 px-4"
              required
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium ml-1">
              Mobile Number
            </Label>
            <div className="flex items-center border border-input rounded-lg overflow-hidden h-10 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
              <div className="flex items-center gap-2 px-3 border-r border-border bg-muted/50 h-full">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  +91
                </span>
              </div>
              <input
                id="phone"
                type="tel"
                placeholder="12345 67890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-full px-3 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          {/* Address (Hostel & Room) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium ml-1">Address</Label>
            <div className="flex gap-2">
              <Select onValueChange={setAddress} required>
                <SelectTrigger className="w-3/5 rounded-lg border-input focus:ring-primary focus:border-primary h-10">
                  <SelectValue placeholder="Hostel" />
                </SelectTrigger>
                <SelectContent>
                  {hostels.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Room No"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-2/5 rounded-lg border-input focus:ring-primary focus:border-primary h-10 px-4"
                required
              />
            </div>
          </div>

          {/* Password */}
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
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium ml-1"
            >
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-lg border-input focus:ring-primary focus:border-primary h-10 px-4 tracking-widest"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-xs ml-1">
                Passwords do not match
              </p>
            )}
          </div>

          <div className="pt-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-4 px-4 leading-tight">
              By continuing, you agree to{" "}
              <span className="font-bold text-foreground">Terms of Use</span>{" "}
              and{" "}
              <span className="font-bold text-foreground">Privacy Policy</span>.
            </p>

            <Button
              type="submit"
              className="w-3/4 rounded-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 mb-2"
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>

            <div className="text-xs text-muted-foreground mt-2">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Log In
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
