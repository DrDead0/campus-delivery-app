"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "../product-actions";

interface ProductFormProps {
  product?: any;
  onClose: () => void;

  machines?: any[];
  stores?: any[];
  onSave: (promise: Promise<any>) => void;
}

function ProductForm({
  product,
  onClose,
  machines = [],
  stores = [],
  onSave,
}: ProductFormProps) {
  const [pending, startTransition] = useTransition();
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const isEdit = !!product;

  // Pre-populate selected machines and stores
  useEffect(() => {
    if (isEdit && product) {
      if (machines.length > 0) {
        const machinesWithProduct = machines
          .filter((machine) =>
            machine.items?.some(
              (item: any) =>
                item.productId && item.productId.toString() === product._id
            )
          )
          .map((m) => m._id);
        setSelectedMachines(machinesWithProduct);
      }
      if (stores.length > 0) {
        const storesWithProduct = stores
          .filter((store) =>
            store.items?.some(
              (item: any) =>
                item.productId && item.productId.toString() === product._id
            )
          )
          .map((s) => s._id);
        setSelectedStores(storesWithProduct);
      }
    } else {
      setSelectedMachines([]);
      setSelectedStores([]);
    }
  }, [isEdit, product, machines, stores]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Close form immediately
    onClose();

    // Start the save operation
    const savePromise = new Promise(async (resolve, reject) => {
      startTransition(async () => {
        const action = isEdit ? updateProductAction : createProductAction;
        const res = await action(fd);
        if (res.ok) {
          toast.success(isEdit ? "Product updated" : "Product created");
          resolve(res);
        } else {
          toast.error(res.error || "Failed");
          reject(res.error);
        }
      });
    });

    onSave(savePromise);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={product._id} />}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. KitKat"
          defaultValue={product?.name || ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="Description">Description</Label>
        <Input
          id="Description"
          name="Description"
          placeholder="Crispy wafer chocolate bar"
          defaultValue={product?.Description || ""}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="1"
            defaultValue={product?.price || ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="availability">Availability</Label>
          <Select
            name="availability"
            defaultValue={product?.availability || "inStock"}
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
        <div>
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={product?.type || "veg"}>
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
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          name="image"
          placeholder="/icon.svg"
          defaultValue={product?.image || ""}
          required
        />
      </div>
      {machines.length > 0 && (
        <div>
          <Label>Vending Machines</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
            {machines.map((machine) => (
              <div key={machine._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`machine-${machine._id}`}
                  checked={selectedMachines.includes(machine._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMachines([...selectedMachines, machine._id]);
                    } else {
                      setSelectedMachines(
                        selectedMachines.filter((id) => id !== machine._id)
                      );
                    }
                  }}
                  className="h-4 w-4"
                />
                <label
                  htmlFor={`machine-${machine._id}`}
                  className="text-sm cursor-pointer"
                >
                  {machine.names} ({machine.location})
                </label>
              </div>
            ))}
          </div>
          <input
            type="hidden"
            name="vendingMachines"
            value={selectedMachines.join(",")}
          />
        </div>
      )}

      {stores.length > 0 && (
        <div>
          <Label>Stores</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
            {stores.map((store) => (
              <div key={store._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`store-${store._id}`}
                  checked={selectedStores.includes(store._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStores([...selectedStores, store._id]);
                    } else {
                      setSelectedStores(
                        selectedStores.filter((id) => id !== store._id)
                      );
                    }
                  }}
                  className="h-4 w-4"
                />
                <label
                  htmlFor={`store-${store._id}`}
                  className="text-sm cursor-pointer"
                >
                  {store.name} ({store.id})
                </label>
              </div>
            ))}
          </div>
          <input type="hidden" name="stores" value={selectedStores.join(",")} />
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProductsListClient({
  products,
  machines = [],
  stores = [],
}: {
  products: any[];
  machines?: any[];
  stores?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const editingProduct = products.find((p) => p._id === editingId);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product?")) return;
    const fd = new FormData();
    fd.append("id", id);
    startDeleteTransition(async () => {
      const res = await deleteProductAction(fd);
      if (res.ok) toast.success("Product deleted");
      else toast.error(res.error || "Failed to delete");
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">All Products</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null);
            setOpen(true);
          }}
        >
          Add Product
        </Button>
      </div>
      <div className="space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products yet.</p>
        ) : (
          products.map((product) => (
            <div
              key={product._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{product.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {product.Description}
                </p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="bg-secondary px-2 py-1 rounded">
                    ${product.price}
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${
                      product.availability === "inStock"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.availability === "inStock"
                      ? "In Stock"
                      : "Out of Stock"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(product._id);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(product._id)}
                  disabled={deletePending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            machines={machines}
            stores={stores}
            onSave={async (promise) => {
              setSaving(true);
              try {
                await promise;
              } finally {
                setSaving(false);
              }
            }}
            onClose={() => {
              setOpen(false);
              setEditingId(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Saving product...</p>
          </div>
        </div>
      )}
    </>
  );
}
