"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminOrdersManagement({ orders }: { orders: any[] }) {
  const router = useRouter();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isPending, startTransition] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("all");

  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case "today":
        return { start: today, end: tomorrow };
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today };
      }
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: tomorrow };
      }
      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: monthAgo, end: tomorrow };
      }
      default:
        return { start: new Date(0), end: tomorrow };
    }
  };

  const filterOrders = (ordersToFilter: any[]) => {
    if (dateFilter === "all") return ordersToFilter;

    const { start, end } = getDateRange(dateFilter);
    return ordersToFilter.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate < end;
    });
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        const { updateOrderStatusAction } = await import(
          "@/app/actions/order-actions"
        );
        const res = await updateOrderStatusAction(orderId, newStatus);
        if (res.ok) {
          toast.success(`Order status updated to ${newStatus}`);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update order");
        }
      } catch (error) {
        toast.error("Failed to update order status");
      }
    });
  };

  const handleCancelOrder = (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    startTransition(async () => {
      try {
        const { cancelOrderAction } = await import(
          "@/app/actions/order-actions"
        );
        const res = await cancelOrderAction(orderId);
        if (res.ok) {
          toast.success("Order cancelled");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to cancel order");
        }
      } catch (error) {
        toast.error("Failed to cancel order");
      }
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "destructive";
      case "READY":
        return "outline";
      case "PREPARING":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const groupedOrders = orders.reduce((acc, order) => {
    const status = order.status || "PENDING";
    if (!acc[status]) acc[status] = [];
    acc[status].push(order);
    return acc;
  }, {} as Record<string, any[]>);

  const filteredGroupedOrders = Object.keys(groupedOrders).reduce(
    (acc, status) => {
      // Only filter DELIVERED and CANCELLED orders by date
      if (status === "DELIVERED" || status === "CANCELLED") {
        acc[status] = filterOrders(groupedOrders[status]);
      } else {
        // Keep active orders unfiltered
        acc[status] = groupedOrders[status];
      }
      return acc;
    },
    {} as Record<string, any[]>
  );

  const statusOrder = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "DELIVERED",
    "CANCELLED",
  ];

  const getFilterLabel = () => {
    const labels: Record<string, string> = {
      all: "All Time",
      today: "Today",
      yesterday: "Yesterday",
      week: "Last 7 Days",
      month: "Last Month",
    };
    return labels[dateFilter] || "All Time";
  };

  const pendingOrders = statusOrder
    .filter((s) => s !== "DELIVERED" && s !== "CANCELLED")
    .flatMap((status) => filteredGroupedOrders[status] || []);

  return (
    <div className="mb-6 space-y-6">
      {/* Pending Orders Section - Store Page Style */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Pending Orders</h3>
            <p className="text-sm text-muted-foreground">
              Manage incoming orders and update their status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.refresh()}
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
              No pending orders.
            </div>
          ) : (
            pendingOrders.map((order) => {
              const storeTotal = order.items.reduce(
                (acc: number, item: any) =>
                  acc + (item.price || 0) * (item.quantity || 1),
                0
              );

              return (
                <Card key={order._id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm bg-muted text-muted-foreground px-2 py-1 rounded">
                            #{order._id.slice(-6)}
                          </span>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {order.sourceName}
                          </span>
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
                            </div>
                          ))}
                        </div>
                        <div className="font-bold">Total: ₹{storeTotal}</div>
                        {order.address && (
                          <div className="text-xs text-muted-foreground">
                            Deliver to: {order.address}
                          </div>
                        )}
                        {order.userPhone && (
                          <div className="text-xs text-muted-foreground">
                            Phone: {order.userPhone}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[120px]">
                        {(order.status === "PENDING" ||
                          order.status === "CONFIRMED") && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelOrder(order._id)}
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

      {/* Delivered & Cancelled Section - 50% Width Side by Side */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order History</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {getFilterLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDateFilter("all")}>
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter("today")}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter("yesterday")}>
                  Yesterday
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter("week")}>
                  Last 7 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter("month")}>
                  Last Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Delivered Orders */}
            <div>
              <div className="bg-muted/50 px-4 py-3 rounded-t-lg flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant("DELIVERED")}>
                    DELIVERED
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    ({(filteredGroupedOrders["DELIVERED"] || []).length})
                  </span>
                </div>
              </div>
              <div className="border rounded-b-lg max-h-[300px] overflow-y-auto space-y-2 p-4">
                {(filteredGroupedOrders["DELIVERED"] || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No delivered orders
                  </p>
                ) : (
                  (filteredGroupedOrders["DELIVERED"] || []).map((order) => {
                    const isExpanded = expandedOrder === order._id;
                    return (
                      <div
                        key={order._id}
                        className="border rounded-lg overflow-hidden hover:bg-muted/30 transition-colors"
                      >
                        <button
                          onClick={() =>
                            setExpandedOrder(isExpanded ? null : order._id)
                          }
                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 text-sm"
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                                #{order._id.slice(-6)}
                              </span>
                              <span className="text-xs font-medium">
                                {order.userName || "Unknown"}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              ₹{order.storeTotal || 0} •{" "}
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="border-t bg-muted/20 px-3 py-2 space-y-2 text-xs">
                            <div>
                              <h5 className="text-xs font-semibold mb-1">
                                Items
                              </h5>
                              <ul className="space-y-0.5">
                                {order.items.map((item: any, idx: number) => (
                                  <li
                                    key={idx}
                                    className="text-muted-foreground"
                                  >
                                    {item.quantity}x {item.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {order.address && (
                              <div>
                                <h5 className="text-xs font-semibold mb-0.5">
                                  Address
                                </h5>
                                <p className="text-muted-foreground">
                                  {order.address}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cancelled Orders */}
            <div>
              <div className="bg-muted/50 px-4 py-3 rounded-t-lg flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant("CANCELLED")}>
                    CANCELLED
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    ({(filteredGroupedOrders["CANCELLED"] || []).length})
                  </span>
                </div>
              </div>
              <div className="border rounded-b-lg max-h-[300px] overflow-y-auto space-y-2 p-4">
                {(filteredGroupedOrders["CANCELLED"] || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No cancelled orders
                  </p>
                ) : (
                  (filteredGroupedOrders["CANCELLED"] || []).map((order) => {
                    const isExpanded = expandedOrder === order._id;
                    return (
                      <div
                        key={order._id}
                        className="border rounded-lg overflow-hidden hover:bg-muted/30 transition-colors"
                      >
                        <button
                          onClick={() =>
                            setExpandedOrder(isExpanded ? null : order._id)
                          }
                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 text-sm"
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                                #{order._id.slice(-6)}
                              </span>
                              <span className="text-xs font-medium">
                                {order.userName || "Unknown"}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              ₹{order.storeTotal || 0} •{" "}
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="border-t bg-muted/20 px-3 py-2 space-y-2 text-xs">
                            <div>
                              <h5 className="text-xs font-semibold mb-1">
                                Items
                              </h5>
                              <ul className="space-y-0.5">
                                {order.items.map((item: any, idx: number) => (
                                  <li
                                    key={idx}
                                    className="text-muted-foreground"
                                  >
                                    {item.quantity}x {item.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {order.address && (
                              <div>
                                <h5 className="text-xs font-semibold mb-0.5">
                                  Address
                                </h5>
                                <p className="text-muted-foreground">
                                  {order.address}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
