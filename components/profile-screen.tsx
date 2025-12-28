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
import { hostels } from "@/lib/data";
import { ModeToggle } from "@/components/mode-toggle";

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
  address?: string; // This is the Hostel
  roomNumber?: string;
  profileImage?: string;
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "", // Hostel
    roomNumber: "",
    profileImage: "",
  });
  const [avatars, setAvatars] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const res = await fetch("/api/avatars");
        if (res.ok) {
          const data = await res.json();
          setAvatars(data.avatars || []);
        }
      } catch (err) {
        console.error("Failed to fetch avatars", err);
      }
    };

    const fetchData = async () => {
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

          if (data._id || data.id) {
            try {
              const { getUserOrders } = await import(
                "@/app/actions/order-actions"
              );
              const orders = await getUserOrders(data._id || data.id);
              data.orders = orders;
            } catch (e) {
              console.error("Failed to fetch orders", e);
            }
          }

          setUser(data);
          setEditForm({
            name: data.name || "",
            phone: data.phone || "",
            address: data.address || "",
            roomNumber: data.roomNumber || "",
            profileImage: data.profileImage || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
    fetchData();
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
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
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
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {avatars.map((avatar) => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              profileImage: avatar,
                            }))
                          }
                          className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${
                            editForm.profileImage === avatar
                              ? "border-primary ring-2 ring-primary ring-offset-2"
                              : "border-transparent hover:border-muted-foreground"
                          }`}
                        >
                          <img
                            src={`/${avatar}`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hostel">Hostel</Label>
                      <Select
                        value={editForm.address}
                        onValueChange={(value) =>
                          setEditForm({ ...editForm, address: value })
                        }
                      >
                        <SelectTrigger id="hostel">
                          <SelectValue placeholder="Select hostel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hostels.map((hostel) => (
                            <SelectItem key={hostel} value={hostel}>
                              {hostel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomNumber">Room Number</Label>
                      <Input
                        id="roomNumber"
                        value={editForm.roomNumber}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            roomNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. 101"
                      />
                    </div>
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
                src={
                  user.profileImage
                    ? `/${user.profileImage}`
                    : `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                }
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
            <p className="font-medium">
              {user.roomNumber ? `Room ${user.roomNumber}, ` : ""}
              {user.address || "Not set"}
            </p>
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold">₹{order.totalAmount}</span>
                      {(order.status === "PENDING" ||
                        order.status === "CONFIRMED") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 text-xs px-2"
                          onClick={async () => {
                            if (!confirm("Cancel this order?")) return;
                            const { cancelOrderAction } = await import(
                              "@/app/actions/order-actions"
                            );
                            const res = await cancelOrderAction(order._id);
                            if (res.ok) {
                              // Force reload or re-fetch
                              window.location.reload();
                            } else {
                              alert(res.error || "Failed to cancel");
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Display Source Info (Take from first item for now as orders are typically single source) */}
                  {order.items.length > 0 &&
                    (order.items[0] as any).sourceName && (
                      <div className="mb-2">
                        <p className="text-sm font-semibold">
                          {(order.items[0] as any).sourceName}
                        </p>
                        {(order.items[0] as any).sourcePhone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {(order.items[0] as any).sourcePhone}
                          </p>
                        )}
                      </div>
                    )}

                  <p className="text-xs text-muted-foreground truncate">
                    {order.items
                      .map((i) => `${i.quantity}x ${i.name}`)
                      .join(", ")}
                  </p>
                  {/* @ts-ignore */}
                  {order.address && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1 border-t pt-2">
                      <MapPin className="w-3 h-3" />
                      {/* @ts-ignore */}
                      {order.address}
                    </div>
                  )}
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
