"use client";

import { MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hostels } from "@/lib/data";
import { toast } from "sonner";
import { useState } from "react";

interface DeliveryDetailsProps {
  selectedHostel: string;
  onHostelChange: (hostel: string) => void;
  roomNumber: string;
  onRoomChange: (room: string) => void;
  hasAddress: boolean;
}

export function DeliveryDetails({
  selectedHostel,
  onHostelChange,
  roomNumber,
  onRoomChange,
  hasAddress,
}: DeliveryDetailsProps) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 delay-100">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
          Delivery Address
        </h2>
        {/* If viewing, show Edit button */}
        {!isEditingAddress && hasAddress && (
          <button
            onClick={() => setIsEditingAddress(true)}
            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        )}
      </div>

      <Card className="p-5 shadow-sm border-border rounded-2xl bg-card">
        {isEditingAddress || !hasAddress ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-bold uppercase">
                Select Hostel / Building
              </Label>
              <Select value={selectedHostel} onValueChange={onHostelChange}>
                <SelectTrigger className="rounded-xl border-border bg-muted/50 h-10">
                  <SelectValue placeholder="Select Hostel" />
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
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-bold uppercase">
                Room Number
              </Label>
              <Input
                value={roomNumber}
                onChange={(e) => onRoomChange(e.target.value)}
                placeholder="e.g. 304, Block A"
                className="rounded-xl border-border bg-muted/50 h-10"
              />
            </div>
            <Button
              onClick={() => {
                if (selectedHostel && roomNumber) setIsEditingAddress(false);
                else toast.error("Please fill all fields");
              }}
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl"
            >
              Save Address
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground line-clamp-1">
                {roomNumber}, {selectedHostel}
              </p>
              <p className="text-xs text-muted-foreground">Campus Delivery</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
