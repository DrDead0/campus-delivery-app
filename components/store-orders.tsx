"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { settleOrders } from "@/app/actions/order-actions";
import { Download } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface StoreOrderProps {
    orders: any[];
    storeId: string;
}

export function StoreOrders({ orders, storeId }: StoreOrderProps) {
    const [loading, setLoading] = useState(false);
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [range, setRange] = useState("today");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    const handleDownload = () => {
        const params = new URLSearchParams();
        params.set("sourceType", "STORE");
        params.set("sourceId", storeId);
        params.set("range", range);
        if (range === "custom") {
            if (!customStart || !customEnd) {
                toast.error("Please select start and end dates");
                return;
            }
            params.set("startDate", customStart);
            params.set("endDate", customEnd);
        }

        const url = `/api/admin/reports/sales?${params.toString()}`;
        window.open(url, "_blank");
        setDownloadOpen(false);
    };

    const pendingOrders = orders.filter(
        (o) =>
            o.items.some(
                (i: any) =>
                    i.sourceId === storeId && i.source === "STORE" && !i.isSettled
            )
    );

    const calculateStoreTotal = (order: any) => {
        return order.items
            .filter((i: any) => i.sourceId === storeId)
            .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>Orders containing items from this store</CardDescription>
                    </div>

                    <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" /> Download Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Download Sales Report</DialogTitle>
                                <DialogDescription>Select date range for this store's sales report.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <Select value={range} onValueChange={setRange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="yesterday">Yesterday</SelectItem>
                                            <SelectItem value="2days">Last 2 Days</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="custom">Custom Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {range === "custom" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDownloadOpen(false)}>Cancel</Button>
                                <Button onClick={handleDownload}>Download</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total (Store)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Settlement</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-muted-foreground h-24"
                                    >
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => {
                                    const storeItems = order.items.filter(
                                        (i: any) => i.sourceId === storeId
                                    );
                                    if (storeItems.length === 0) return null;

                                    const isSettled = storeItems.every((i: any) => i.isSettled);
                                    const storeTotal = calculateStoreTotal(order);

                                    return (
                                        <TableRow key={order._id}>
                                            <TableCell className="font-mono text-xs">
                                                {order._id.slice(-6)}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {storeItems.map((item: any, idx: number) => (
                                                        <div key={idx} className="text-xs">
                                                            {item.quantity}x {item.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>₹{storeTotal}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        order.status === "DELIVERED"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {isSettled ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-green-50 text-green-700 border-green-200"
                                                    >
                                                        Settled
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                                                    >
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
