import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User as UserIcon,
  MapPin,
  Phone,
  ShoppingBag,
  FileText,
  HelpCircle,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { hostels } from "@/lib/data";
import { ModeToggle } from "@/components/mode-toggle";
import { useCart } from "@/app/context/CartContext";

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
  address?: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string;
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
  const router = useRouter();
  const { setSelectedHostel, setRoomNumber } = useCart();
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
  const [showOrders, setShowOrders] = useState(false);
  const [orderTab, setOrderTab] = useState<"ongoing" | "history">("ongoing");

  useEffect(() => {
    // Debug logging to check for infinite remounts
    console.log("ProfileScreen mounted");

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
    router.push("/login"); // Redirect instead of reload
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

        // Update global cart context
        if (updatedUser.address) setSelectedHostel(updatedUser.address);
        if (updatedUser.roomNumber) setRoomNumber(updatedUser.roomNumber);
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

  // Filter orders into ongoing and history
  const ongoingStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY"];
  const ongoingOrders = (user?.orders || []).filter((order) =>
    ongoingStatuses.includes(order.status)
  );
  const historyOrders = (user?.orders || []).filter(
    (order) =>
      !["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(order.status)
  );

  // OrderCard Component
  const OrderCard = ({
    order,
    showCancel,
  }: {
    order: Order;
    showCancel: boolean;
  }) => {
    // Status badge color logic
    const getStatusColor = (status: string) => {
      switch (status) {
        case "PENDING":
          return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
        case "CONFIRMED":
          return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
        case "PREPARING":
          return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
        case "READY":
          return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
        case "DELIVERED":
          return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
        case "CANCELLED":
          return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
        default:
          return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
      }
    };

    return (
      <div className="border rounded-lg p-3 space-y-2 bg-card hover:bg-muted/30 transition-colors">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                #{order._id.slice(-6)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">₹{order.totalAmount}</p>
          </div>
        </div>

        {/* Source Info */}
        {order.items.length > 0 && (order.items[0] as any).sourceName && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium">
              {(order.items[0] as any).sourceName}
            </p>
            {(order.items[0] as any).sourcePhone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                {(order.items[0] as any).sourcePhone}
              </p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="text-xs text-muted-foreground">
          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
        </div>

        {/* Address */}
        {order.address && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <MapPin className="w-3 h-3" />
            {order.address}
          </div>
        )}

        {/* Cancel Button */}
        {showCancel && (
          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
              onClick={async () => {
                if (!confirm("Cancel this order?")) return;
                const { cancelOrderAction } = await import(
                  "@/app/actions/order-actions"
                );
                const res = await cancelOrderAction(order._id);
                if (res.ok) {
                  router.refresh();
                  // Force a re-fetch of data since router.refresh might not update client-side state
                  // Or just reload for now, but safer:
                  window.location.href = "/restaurant/profile";
                } else {
                  alert(res.error || "Failed to cancel");
                }
              }}
            >
              Cancel Order
            </Button>
          </div>
        )}
      </div>
    );
  };

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
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md pb-4 pt-4 px-4 -mx-4 border-b flex items-center justify-between shadow-sm mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex items-center gap-2">
          <ModeToggle />

          {/* Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-secondary/80 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/terms">
                <DropdownMenuItem className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Terms & Conditions</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/help">
                <DropdownMenuItem className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Orders Section - Collapsible with Tabs */}
      <Card className="overflow-hidden">
        <CardHeader
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setShowOrders(!showOrders)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">My Orders</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.orders?.length || 0} total orders
                </p>
              </div>
            </div>
            <div className="text-muted-foreground">
              {showOrders ? "▼" : "▶"}
            </div>
          </div>
        </CardHeader>

        {showOrders && (
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setOrderTab("ongoing")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  orderTab === "ongoing"
                    ? "border-b-2 border-primary text-primary bg-primary/5"
                    : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                Ongoing
                {ongoingOrders.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20">
                    {ongoingOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setOrderTab("history")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  orderTab === "history"
                    ? "border-b-2 border-primary text-primary bg-primary/5"
                    : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                History
                {historyOrders.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted">
                    {historyOrders.length}
                  </span>
                )}
              </button>
            </div>

            {/* Orders List */}
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {orderTab === "ongoing" ? (
                ongoingOrders.length > 0 ? (
                  ongoingOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      showCancel={true}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No ongoing orders</p>
                  </div>
                )
              ) : historyOrders.length > 0 ? (
                historyOrders.map((order) => (
                  <OrderCard key={order._id} order={order} showCancel={false} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No order history</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
