"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  createStoreAction,
  updateStoreAction,
  deleteStoreAction,
} from "./actions";

interface StoreFormProps {
  store?: any;
  onClose: () => void;
  onSave: (promise: Promise<any>) => void;
}

function StoreForm({ store, onClose, onSave }: StoreFormProps) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!store;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    onClose();

    const savePromise = new Promise(async (resolve, reject) => {
      startTransition(async () => {
        const action = isEdit ? updateStoreAction : createStoreAction;
        const res = await action(fd);
        if (res.ok) {
          toast.success(isEdit ? "Store updated" : "Store created");
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
      {isEdit && <input type="hidden" name="originalId" value={store.id} />}
      <div>
        <Label htmlFor="id">Store ID (Unique)</Label>
        <Input
          id="id"
          name="id"
          placeholder="e.g. campus-cafe"
          defaultValue={store?.id || ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Campus Cafe"
          defaultValue={store?.name || ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Best coffee on campus"
          defaultValue={store?.description || ""}
          required
        />
      </div>
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

export function StoresListClient({ stores }: { stores: any[] }) {
  const [open, setOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this store?")) return;
    const fd = new FormData();
    fd.append("id", id);
    startDeleteTransition(async () => {
      const res = await deleteStoreAction(fd);
      if (res.ok) toast.success("Store deleted");
      else toast.error(res.error || "Failed to delete");
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">All Stores</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingStore(null);
            setOpen(true);
          }}
        >
          Add Store
        </Button>
      </div>
      <div className="space-y-3">
        {stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stores yet.</p>
        ) : (
          stores.map((store) => (
            <div
              key={store._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{store.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {store.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {store.id} · Items: {store.items?.length || 0}
                </p>
              </div>
              <div className="flex gap-2 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingStore(store);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(store.id)}
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
              {editingStore ? "Edit Store" : "Add Store"}
            </DialogTitle>
          </DialogHeader>
          <StoreForm
            store={editingStore}
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
              setEditingStore(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Saving store...</p>
          </div>
        </div>
      )}
    </>
  );
}
