"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  restockVendingItemAction,
  createVendingMachineAction,
  updateVendingMachineAction,
} from "./vending-actions";
import { PasswordInput } from "@/components/ui/password-input";

interface VendingMachinesClientProps {
  machines: any[];
  products: any[];
}

export function VendingMachinesClient({
  machines,
  products,
}: VendingMachinesClientProps) {
  const [open, setOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");

  const [pending, setPending] = useState(false);

  // Management State
  const [manageOpen, setManageOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<any | null>(null);
  const [managePending, setManagePending] = useState(false);

  const currentMachine = machines.find((m) => m._id === selectedMachine);
  const currentProduct = products.find((p) => p._id === selectedProduct);

  // Filter products to only show those available in the current machine
  const availableProducts = currentMachine
    ? products.filter((product) =>
        currentMachine.items.some(
          (item: any) =>
            item.productId && item.productId.toString() === product._id
        )
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !selectedProduct || !quantity) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setPending(true);
      const fd = new FormData();
      fd.append("machineId", selectedMachine);
      fd.append("productId", selectedProduct);
      fd.append("quantity", quantity);

      const res = await restockVendingItemAction(fd);
      if (res.ok) {
        toast.success("Stock updated successfully");
        setOpen(false);
        setSelectedMachine("");
        setSelectedProduct("");
        setQuantity("");
      } else {
        toast.error(res.error || "Failed to update");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="default"
          onClick={() => setOpen(true)}
          className="flex-1"
        >
          Restock
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setEditingMachine(null);
            setManageOpen(true);
          }}
          className="flex-1"
        >
          Manage Machines
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Vending Machine Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="machine">Select Machine</Label>
              <Select
                value={selectedMachine}
                onValueChange={(val) => {
                  setSelectedMachine(val);
                  setSelectedProduct("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a machine..." />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.names} ({m.location}, {m.hostel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentMachine && (
              <div>
                <Label htmlFor="product">Select Product</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product: any) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} - ₹{product.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableProducts.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No products added to this machine yet. Add products via
                    "Manage Products".
                  </p>
                )}
              </div>
            )}

            {currentProduct && (
              <div className="p-3 bg-secondary rounded-lg text-sm">
                <p>
                  <strong>Product:</strong> {currentProduct.name}
                </p>
                <p className="text-muted-foreground mt-1">
                  Enter stock quantity for this machine
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="quantity">Stock Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Updating..." : "Update Stock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Machines Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Vending Machines</DialogTitle>
          </DialogHeader>

          {editingMachine || manageOpen ? (
            <div className="space-y-4">
              {!editingMachine && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4 border p-2 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">Existing Machines</h3>
                    <Button
                      size="sm"
                      onClick={() => setEditingMachine({ new: true })}
                    >
                      Add New
                    </Button>
                  </div>
                  {machines.map((m) => (
                    <div
                      key={m._id}
                      className="flex justify-between items-center bg-secondary/50 p-2 rounded text-sm"
                    >
                      <span>
                        {m.names} ({m.id})
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingMachine(m)}
                      >
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {(editingMachine || (editingMachine as any)?.new) && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setManagePending(true);
                    const fd = new FormData(e.currentTarget);

                    try {
                      const action = (editingMachine as any).new
                        ? createVendingMachineAction
                        : updateVendingMachineAction;

                      const res = await action(fd);
                      if (res.ok) {
                        toast.success("Saved successfully");
                        setEditingMachine(null);
                        // If we were adding, we might want to stay in list view
                      } else {
                        toast.error(res.error || "Failed");
                      }
                    } finally {
                      setManagePending(false);
                    }
                  }}
                  className="space-y-4 border-t pt-4"
                >
                  <h3 className="font-semibold">
                    {(editingMachine as any).new
                      ? "Add Machine"
                      : "Edit Machine"}
                  </h3>
                  {!(editingMachine as any).new && (
                    <input
                      type="hidden"
                      name="originalId"
                      value={editingMachine.id}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="id">ID</Label>
                      <Input
                        id="id"
                        name="id"
                        defaultValue={editingMachine.id || ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="names">Name</Label>
                      <Input
                        id="names"
                        name="names"
                        defaultValue={editingMachine.names || ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        defaultValue={editingMachine.location || ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hostel">Hostel</Label>
                      <Input
                        id="hostel"
                        name="hostel"
                        defaultValue={editingMachine.hostel || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        name="type"
                        defaultValue={editingMachine.type || "non-veg"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veg">Veg</SelectItem>
                          <SelectItem value="non-veg">Non-Veg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        defaultValue={editingMachine.username || ""}
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <PasswordInput
                        id="password"
                        name="password"
                        placeholder={
                          !(editingMachine as any).new
                            ? "Leave blank to keep"
                            : "Required"
                        }
                        required={(editingMachine as any).new}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingMachine(null)}
                    >
                      Back to List
                    </Button>
                    <Button type="submit" disabled={managePending}>
                      {managePending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
