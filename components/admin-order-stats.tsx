"use client";

import { settleOrders } from "@/app/actions/order-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, CheckCircle, Download, Calendar as CalendarIcon } from "lucide-react";
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

interface StatItem {
    _id: string; // sourceId
    name: string;
    totalRevenue: number;
    settledAmount: number;
    unsettledAmount: number;
}

interface AdminOrderStatsProps {
    stats: {
        storeStats: StatItem[];
        vendingStats: StatItem[];
    };
}

export function AdminOrderStats({ stats }: AdminOrderStatsProps) {
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [reportType, setReportType] = useState("sales");
    const [sourceType, setSourceType] = useState("ALL"); // ALL, STORE, VENDING
    const [sourceId, setSourceId] = useState("");
    const [range, setRange] = useState("today");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    const handleSettle = async (sourceId: string, name: string) => {
        if (!confirm(`Are you sure you want to settle all pending orders for ${name}?`)) return;

        setLoadingMap(prev => ({ ...prev, [sourceId]: true }));
        try {
            const res = await settleOrders(sourceId);
            if (res.success) {
                toast.success(`Settled orders for ${name}!`);
                window.location.reload();
            } else {
                toast.error("Failed to settle: " + res.error);
            }
        } catch (e) {
            console.error(e);
            toast.error("Error settling orders");
        } finally {
            setLoadingMap(prev => ({ ...prev, [sourceId]: false }));
        }
    };

    const handleDownload = () => {
        const params = new URLSearchParams();
        params.set("range", range);
        if (range === "custom") {
            if (!customStart || !customEnd) {
                toast.error("Please select start and end dates");
                return;
            }
            params.set("startDate", customStart);
            params.set("endDate", customEnd);
        }

        if (sourceType !== "ALL") {
            params.set("sourceType", sourceType);
            if (sourceId) params.set("sourceId", sourceId);
        }

        const url = `/api/admin/reports/sales?${params.toString()}`;
        window.open(url, "_blank");
        setDownloadOpen(false);
    };

    const renderStatRow = (item: StatItem) => (
        <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg mb-3 gap-4 hover:bg-muted/30 transition-colors">
            <div className="flex-1">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <div className="flex gap-4 mt-1 text-sm">
                    <div>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold ml-1">₹{item.totalRevenue}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Settled:</span>
                        <span className="font-semibold text-green-600 ml-1">₹{item.settledAmount}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Pending:</span>
                        <span className="font-semibold text-red-600 ml-1">₹{item.unsettledAmount}</span>
                    </div>
                </div>
            </div>

            {item.unsettledAmount > 0 ? (
                <Button
                    onClick={() => handleSettle(item._id, item.name)}
                    disabled={loadingMap[item._id]}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                >
                    {loadingMap[item._id] ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Settle ₹{item.unsettledAmount}
                </Button>
            ) : (
                <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                    All Settled
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold">Financial Overview</h2>

                <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" /> Download Reports
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Download Sales Report</DialogTitle>
                            <DialogDescription>
                                Select criteria to generate an Excel report of sales.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Data Source</Label>
                                <Select value={sourceType} onValueChange={(val) => { setSourceType(val); setSourceId(""); }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Sources</SelectItem>
                                        <SelectItem value="STORE">Specific Store</SelectItem>
                                        <SelectItem value="VENDING">Specific Vending Machine</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {sourceType === "STORE" && (
                                <div className="space-y-2">
                                    <Label>Select Store</Label>
                                    <Select value={sourceId} onValueChange={setSourceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a store" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stats.storeStats.map(s => (
                                                <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {sourceType === "VENDING" && (
                                <div className="space-y-2">
                                    <Label>Select Vending Machine</Label>
                                    <Select value={sourceId} onValueChange={setSourceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a machine" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stats.vendingStats.map(s => (
                                                <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

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
                            <Button onClick={handleDownload} className="gap-2">
                                <Download className="w-4 h-4" /> Download Excel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Stores Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.storeStats.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No data available</p>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto pr-2">
                                {stats.storeStats.map(renderStatRow)}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Vending Machines Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.vendingStats.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No data available</p>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto pr-2">
                                {stats.vendingStats.map(renderStatRow)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
