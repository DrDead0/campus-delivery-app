"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string; // Currently 'hostel' in your model perhaps? adapting to generic address
  orders?: Order[];
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2 } from "lucide-react";

export function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setEditForm({
            name: data.name || "",
            phone: data.phone || "",
            address: data.address || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.reload(); // Simple reload to clear state app-wide
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser({ ...user, ...updatedUser });
        setIsEditing(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Update error", err);
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <UserIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Not Logged In</h2>
          <p className="text-muted-foreground">
            Please login to view your profile and place orders.
          </p>
        </div>
        <Button asChild className="w-full max-w-xs" size="lg">
          <Link href="/login">Login / Register</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-background overflow-hidden relative">
        <CardContent className="pt-6 pb-6 relative">
          {/* Edit Button - Top Right */}
          <div className="absolute top-4 right-4">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-background/80"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      placeholder="+91..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Delivery Address (Hostel/Room)
                    </Label>
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      placeholder="e.g. Hostel H1, Room 101"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20 border-4 border-background shadow-sm">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
              />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pl-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{user.phone || "No phone number added"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-sm">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Delivery Address</p>
            <p className="font-medium">{user.address || "Not set"}</p>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          <h3 className="font-semibold">Order History</h3>
        </div>

        {user.orders && user.orders.length > 0 ? (
          <div className="space-y-3">
            {user.orders.map((order) => (
              <Card key={order._id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 p-3 flex flex-row items-center justify-between space-y-0">
                  <div className="text-xs font-mono text-muted-foreground">
                    #{order._id.slice(-6)}
                  </div>
                  <Badge
                    variant={
                      order.status === "delivered" ? "default" : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold">₹{order.totalAmount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.items
                      .map((i) => `${i.quantity}x ${i.name}`)
                      .join(", ")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border-dashed border-2">
            <p>No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
