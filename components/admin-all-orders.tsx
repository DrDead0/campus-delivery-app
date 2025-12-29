"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  format,
  isToday,
  isYesterday,
  subDays,
  isAfter,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import * as XLSX from "xlsx";

interface Order {
  _id: string;
  sourceName: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  totalAmount: number;
  storeTotal: number;
  status: string;
  createdAt: string;
}

type DateFilter = "ALL" | "TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "CUSTOM";

export function AdminAllOrders({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filteredOrders = orders.filter((order) => {
    const s = search.toLowerCase();
    const orderDate = new Date(order.createdAt);

    // Search Filter
    const matchesSearch =
      order.userName.toLowerCase().includes(s) ||
      (order.userEmail || "").toLowerCase().includes(s) ||
      String(order.userPhone || "").includes(s) ||
      order._id.toLowerCase().includes(s) ||
      order.sourceName.toLowerCase().includes(s);

    if (!matchesSearch) return false;

    // Date Filter
    if (dateFilter === "ALL") return true;
    if (dateFilter === "TODAY") return isToday(orderDate);
    if (dateFilter === "YESTERDAY") return isYesterday(orderDate);
    if (dateFilter === "WEEK")
      return isAfter(orderDate, subDays(new Date(), 7));
    if (dateFilter === "MONTH")
      return isAfter(orderDate, subDays(new Date(), 30));
    if (dateFilter === "CUSTOM") {
      if (!customStart || !customEnd) return true; // Show all if dates not picked yet
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));
      return isWithinInterval(orderDate, { start, end });
    }

    return true;
  });

  const downloadExcel = () => {
    const dataToExport = filteredOrders.map((order) => ({
      "Order ID": order._id,
      Date: format(new Date(order.createdAt), "PPP p"),
      "Customer Name": order.userName,
      "Customer Phone": order.userPhone || "",
      "Customer Email": order.userEmail || "",
      Source: order.sourceName,
      "Store Amount": order.storeTotal,
      "User Paid": order.totalAmount,
      Status: order.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    // Fix column widths
    const wscols = [
      { wch: 25 }, // ID
      { wch: 25 }, // Date
      { wch: 20 }, // Name
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 20 }, // Source
      { wch: 12 }, // Store Amt
      { wch: 12 }, // User Paid
      { wch: 15 }, // Status
    ];
    worksheet["!cols"] = wscols;

    const fileName =
      dateFilter === "CUSTOM" && customStart && customEnd
        ? `orders_${customStart}_to_${customEnd}.xlsx`
        : `orders_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <CardTitle className="whitespace-nowrap">All Orders</CardTitle>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {/* Date Filter */}
            <div className="flex gap-2">
              <Select
                value={dateFilter}
                onValueChange={(v: any) => setDateFilter(v)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                  <SelectItem value="WEEK">Last 7 Days</SelectItem>
                  <SelectItem value="MONTH">Last 30 Days</SelectItem>
                  <SelectItem value="CUSTOM">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === "CUSTOM" && (
                <>
                  <Input
                    type="date"
                    className="h-9 w-auto"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    placeholder="Start"
                  />
                  <Input
                    type="date"
                    className="h-9 w-auto"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    placeholder="End"
                  />
                </>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-[250px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={downloadExcel}
              className="h-9 whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border h-[500px] overflow-hidden">
          <div className="overflow-auto h-full">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[100px]">Order ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Store / Source</TableHead>
                  <TableHead>Store Amount</TableHead>
                  <TableHead>User Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs">
                        #{order._id.slice(-6)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(order.createdAt), "PPP")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(order.createdAt), "p")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.userPhone || "No Phone"}
                          </span>
                          {order.userEmail && (
                            <span className="text-xs text-muted-foreground hidden sm:inline-block">
                              {order.userEmail}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{order.sourceName}</span>
                      </TableCell>
                      <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                        ₹{order.storeTotal}
                      </TableCell>
                      <TableCell className="font-bold text-green-600 dark:text-green-400">
                        ₹{order.totalAmount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "DELIVERED"
                              ? "default"
                              : order.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {order.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
