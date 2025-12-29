"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  updateStoreDetailsAction,
  updateProductAction,
  createStoreProductAction,
  deleteStoreProductAction,
} from "./store-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, MapPin, Package } from "lucide-react";
import { hostels } from "@/lib/data";

export function StoreDashboardClient({
  data,
  type,
  initialOrders,
}: {
  data: any;
  type: string;
  initialOrders: any[];
}) {
  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search/Header area is handled by parent page or layout, focusing on dashboard content */}

      {/* Store Identity Section */}
      <section className="relative group rounded-xl overflow-hidden bg-card shadow-sm border border-border">
        <div className="h-32 bg-muted/40">
          {/* Cover image placeholder or actual cover if we had one */}
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start -mt-12">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-card p-1 border border-border shadow-sm">
                <img
                  src={data.image || "/placeholder.jpg"}
                  alt={data.name || data.names}
                  className="w-full h-full object-cover rounded-lg bg-muted"
                />
              </div>
            </div>

            <div className="flex-1 mt-12 sm:mt-14 space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {data.name || data.names}
                  </h2>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {data.location || "No location set"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditStoreOpen(true)}
                  className="shrink-0 gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Details
                </Button>
              </div>

              {type === "store" && (
                <p className="text-muted-foreground max-w-2xl text-sm mt-3">
                  {data.description || "No description provided."}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === "orders" ? "default" : "ghost"}
          onClick={() => setActiveTab("orders")}
          className="gap-2"
        >
          Recent Orders
        </Button>
        <Button
          variant={activeTab === "products" ? "default" : "ghost"}
          onClick={() => setActiveTab("products")}
          className="gap-2"
        >
          Products
        </Button>
      </div>

      {/* Content Areas */}
      {activeTab === "orders" ? (
        <OrdersManager
          initialOrders={initialOrders}
          storeId={data.id || data._id}
        />
      ) : (
        <ProductsManager data={data} type={type} />
      )}

      {/* Edit Details Dialog */}
      <Dialog open={isEditStoreOpen} onOpenChange={setIsEditStoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Store Details</DialogTitle>
          </DialogHeader>
          <DetailsForm
            data={data}
            type={type}
            onClose={() => setIsEditStoreOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrdersManager({
  initialOrders,
  storeId,
}: {
  initialOrders: any[];
  storeId: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [timeFilter, setTimeFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const router = useRouter();

  // Polling for new orders
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { getStoreOrders } = await import("@/app/actions/order-actions");
        const latestOrders = await getStoreOrders(storeId);

        setOrders((prev) => {
          if (latestOrders.length > prev.length) {
            const newCount = latestOrders.length - prev.length;
            toast.info(`${newCount} new order(s) received!`, {
              duration: 5000,
            });
          }
          return latestOrders;
        });
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [storeId]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const { updateOrderStatusAction } = await import("./store-actions");
    const res = await updateOrderStatusAction(orderId, newStatus);
    if (res.ok) {
      toast.success(`Order marked as ${newStatus}`);
      router.refresh(); // Refresh server data
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } else {
      toast.error("Failed to update status");
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      const orderDate = new Date(order.createdAt);

      if (timeFilter === "custom") {
        if (customStart && customEnd) {
          const start = new Date(customStart); // Start of day
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999); // End of day
          return orderDate >= start && orderDate <= end;
        }
        return true; // Show all if dates not picked? Or none? all seems safer
      }

      if (timeFilter === "all") return true;

      const now = new Date();
      if (timeFilter === "today") {
        return orderDate.toDateString() === now.toDateString();
      }
      if (timeFilter === "week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return orderDate >= weekAgo;
      }
      if (timeFilter === "month") {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return orderDate >= monthAgo;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "date-asc") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "price-desc") {
        return b.totalAmount - a.totalAmount;
      }
      if (sortBy === "price-asc") {
        return a.totalAmount - b.totalAmount;
      }
      return 0;
    });

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Recent Orders</h3>
          <p className="text-sm text-muted-foreground">
            Manage incoming orders and update their status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {timeFilter === "custom" && (
            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in">
              <Input
                type="date"
                className="h-9 w-32"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                className="h-9 w-32"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => router.refresh()} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            No orders found matching your filters.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const storeTotal = order.items.reduce(
              (acc: number, item: any) => acc + item.price * item.quantity,
              0
            );
            const isSettled =
              order.items.length > 0 &&
              order.items.every((item: any) => item.isSettled);

            return (
              <Card key={order._id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm bg-muted text-muted-foreground px-2 py-1 rounded">
                          #{order._id.slice(-6)}
                        </span>
                        <Badge
                          variant={
                            order.status === "DELIVERED" ||
                            order.status === "COMPLETED"
                              ? "default"
                              : order.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {order.status}
                        </Badge>

                        {order.status !== "CANCELLED" && (
                          <Badge
                            variant="outline"
                            className={
                              isSettled
                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                                : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                            }
                          >
                            {isSettled ? "Settled" : "Settlement Pending"}
                          </Badge>
                        )}

                        <span
                          className="text-sm text-muted-foreground"
                          suppressHydrationWarning
                        >
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {/* Items */}
                      <div className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-2 text-sm">
                            <span className="font-semibold">
                              {item.quantity}x
                            </span>
                            <span>{item.name}</span>
                            <span className="text-muted-foreground">
                              ({item.source})
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="font-bold">
                        Total Earnings: ₹{storeTotal}
                      </div>
                      {order.address && (
                        <div className="text-xs text-muted-foreground">
                          Deliver to: {order.address}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[120px]">
                      {(order.status === "PENDING" ||
                        order.status === "CONFIRMED") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Are you sure you want to cancel this order?"
                              )
                            )
                              return;
                            const { cancelOrderAction } = await import(
                              "@/app/actions/order-actions"
                            );
                            const res = await cancelOrderAction(order._id);
                            if (res.ok) {
                              toast.success("Order cancelled");
                              router.refresh();
                            } else {
                              toast.error(res.error || "Failed to cancel");
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      )}

                      {order.status !== "DELIVERED" &&
                        order.status !== "CANCELLED" && (
                          <>
                            {(order.status === "PENDING" ||
                              order.status === "CONFIRMED") && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(order._id, "PREPARING")
                                }
                              >
                                Prepare
                              </Button>
                            )}
                            {order.status === "PREPARING" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() =>
                                  handleStatusUpdate(order._id, "READY")
                                }
                              >
                                Ready
                              </Button>
                            )}
                            {order.status === "READY" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  handleStatusUpdate(order._id, "DELIVERED")
                                }
                              >
                                Deliver
                              </Button>
                            )}
                          </>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </section>
  );
}

function DetailsForm({
  data,
  type,
  onClose,
}: {
  data: any;
  type: string;
  onClose: () => void;
}) {
  const [loading, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("id", data.id);
    fd.append("type", type);

    startTransition(async () => {
      const res = await updateStoreDetailsAction(fd);
      if (res.ok) {
        toast.success("Details updated");
        router.refresh();
        onClose();
      } else {
        toast.error(res.error || "Failed to update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={data.name || data.names}
          required
        />
      </div>

      <div>
        <Label htmlFor="type-select">Type</Label>
        <Select name="storeType" defaultValue={data.type || "non-veg"}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="veg">Veg</SelectItem>
            <SelectItem value="non-veg">Non-Veg</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type !== "store" && (
        <div>
          <Label htmlFor="hostel-select">Hostel</Label>
          <Select name="hostel" defaultValue={data.hostel || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select Hostel..." />
            </SelectTrigger>
            <SelectContent>
              {hostels.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {type === "store" && (
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={data.description}
            required
            className="resize-none"
            rows={3}
          />
        </div>
      )}
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={data.location}
          required
        />
      </div>
      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          type="number"
          defaultValue={data.phoneNumber}
          required
        />
      </div>
      <div>
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" name="image" defaultValue={data.image} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ProductsManager({ data, type }: { data: any; type: string }) {
  const [items, setItems] = useState<any[]>(data.items || []);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setItems(data.items || []);
  }, [data.items]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsNew(false);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem({});
    setIsNew(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item?")) return;

    const fd = new FormData();
    fd.append("storeId", data.id);
    fd.append("type", type);
    fd.append("itemId", itemId);

    const res = await deleteStoreProductAction(fd);
    if (res.ok) {
      toast.success("Item removed");
      router.refresh();
    } else {
      toast.error("Failed to remove item");
    }
  };

  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.append("storeId", data.id);
    fd.append("type", type);
    if (!isNew) {
      fd.append("itemId", editingItem._id);
    }

    if (isNew) {
      const res = await createStoreProductAction(fd);
      setSaving(false);
      setIsDialogOpen(false);
      if (res.ok) {
        toast.success("Product created");
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
      return;
    }

    // Optimistics
    const newName = String(fd.get("name"));
    const newDesc = String(fd.get("description"));
    const newImage = String(fd.get("image"));
    const newPrice = Number(fd.get("price"));

    let newAvailability = "";
    let newQuantity = 0;
    if (type === "store") {
      newAvailability = String(fd.get("availability"));
    } else {
      newQuantity = Number(fd.get("quantity"));
    }

    const oldItems = [...items];
    setItems((prev) =>
      prev.map((item) => {
        if (item._id === editingItem._id) {
          return {
            ...item,
            price: newPrice,
            name: newName,
            description: newDesc,
            image: newImage,
            productId: item.productId
              ? {
                  ...item.productId,
                  name: newName,
                  Description: newDesc,
                  price: newPrice,
                  image: newImage,
                }
              : undefined,
            availability:
              type === "store" ? newAvailability : item.availability,
            quantity: type !== "store" ? newQuantity : item.quantity,
          };
        }
        return item;
      })
    );

    setIsDialogOpen(false);

    const res = await updateProductAction(fd);
    setSaving(false);

    if (res.ok) {
      toast.success("Item updated");
      router.refresh();
    } else {
      toast.error(res.error || "Failed");
      setItems(oldItems);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Products & Inventory</h3>
          <p className="text-sm text-muted-foreground">
            Manage your store's catalog and stock availability.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg border border-dashed border-border">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">
            No products yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Start by adding your first product to the store.
          </p>
          <Button onClick={handleAdd} variant="outline">
            Add Product
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const name = item.productId?.name || item.name || "Unknown Product";
            const price = item.price ?? item.productId?.price ?? 0;
            const image =
              item.productId?.image || item.image || "/placeholder.jpg";
            const description =
              item.productId?.Description || item.description || "";
            const status = item.availability;
            const quantity = item.quantity ?? 0;
            const isOutOfStock =
              type === "store" ? status === "outOfStock" : quantity === 0;

            return (
              <Card
                key={item._id}
                className="p-4 shadow-sm relative group overflow-hidden"
              >
                {/* Delete button positioned top right of the card */}
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(item._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-border relative">
                    <img
                      src={image}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1 rounded">
                          OUT
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-base truncate pr-2">
                        {name}
                      </h3>
                      {/* Placeholder for spacing, delete button is absolute */}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2 h-[2.5em]">
                      {description || "No description available"}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-primary">
                          ₹{price}
                        </span>
                        {type === "store" ? (
                          <Badge
                            variant={isOutOfStock ? "destructive" : "secondary"}
                            className="capitalize text-[10px] h-5 px-1.5"
                          >
                            {status === "inStock" ? "In Stock" : "Out of Stock"}
                          </Badge>
                        ) : (
                          <Badge
                            variant={isOutOfStock ? "destructive" : "secondary"}
                            className={`capitalize text-[10px] h-5 px-1.5 ${
                              !isOutOfStock && quantity <= 10
                                ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                                : !isOutOfStock
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
                                : ""
                            }`}
                          >
                            {isOutOfStock
                              ? "Out of Stock"
                              : quantity <= 10
                              ? "Low Stock"
                              : `In Stock: ${quantity}`}
                          </Badge>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-16 text-xs"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNew ? "Add New Product" : "Edit Product"}
            </DialogTitle>
          </DialogHeader>
          {(isNew || editingItem) && (
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  name="name"
                  defaultValue={
                    isNew ? "" : editingItem.productId?.name || editingItem.name
                  }
                  placeholder="Product Name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prod-type">Type</Label>
                  <Select
                    name="productType"
                    defaultValue={
                      isNew
                        ? "veg"
                        : editingItem.productId?.type ||
                          editingItem.type ||
                          "veg"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Veg</SelectItem>
                      <SelectItem value="non-veg">Non-Veg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="product-desc">Description</Label>
                <Textarea
                  id="product-desc"
                  name="description"
                  placeholder="Product description"
                  defaultValue={
                    isNew
                      ? ""
                      : editingItem.productId?.Description ||
                        editingItem.description ||
                        ""
                  }
                />
              </div>

              <div>
                <Label htmlFor="product-img">Image URL</Label>
                <Input
                  id="product-img"
                  name="image"
                  placeholder="https://..."
                  defaultValue={
                    isNew
                      ? ""
                      : editingItem.productId?.image || editingItem.image || ""
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    defaultValue={
                      isNew
                        ? ""
                        : editingItem.price || editingItem.productId?.price
                    }
                    required
                  />
                </div>
                {type === "store" ? (
                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      name="availability"
                      defaultValue={editingItem?.availability || "inStock"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inStock">In Stock</SelectItem>
                        <SelectItem value="outOfStock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      defaultValue={editingItem?.quantity ?? 0}
                      required
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Product"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
