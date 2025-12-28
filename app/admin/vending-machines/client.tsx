"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  createVendingMachineAction,
  updateVendingMachineAction,
  deleteVendingMachineAction,
} from "../vending-actions";
import { hostels } from "@/lib/data";

interface VendingMachineFormProps {
  machine?: any;
  onClose: () => void;
  onSave: (promise: Promise<any>) => void;
}

function VendingMachineForm({
  machine,
  onClose,
  onSave,
}: VendingMachineFormProps) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!machine;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    onClose();

    const savePromise = new Promise(async (resolve, reject) => {
      startTransition(async () => {
        const action = isEdit
          ? updateVendingMachineAction
          : createVendingMachineAction;
        const res = await action(fd);
        if (res.ok) {
          toast.success(isEdit ? "Machine updated" : "Machine created");
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
      {isEdit && <input type="hidden" name="originalId" value={machine.id} />}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="id">ID (Unique)</Label>
          <Input
            id="id"
            name="id"
            placeholder="e.g. vender-a"
            defaultValue={machine?.id || ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="names">Name</Label>
          <Input
            id="names"
            name="names"
            placeholder="e.g. Main Lobby Vender"
            defaultValue={machine?.names || ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="e.g. Ground Floor"
            defaultValue={machine?.location || ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="hostel">Hostel/Building</Label>
          <Select name="hostel" defaultValue={machine?.hostel || ""} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a hostel..." />
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
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="e.g. vend_admin"
            defaultValue={machine?.username || ""}
            autoComplete="off"
            required
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="password">
            Password {isEdit ? "(leave blank to keep current)" : ""}
          </Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder={isEdit ? "New password" : "Strong password"}
            autoComplete="new-password"
            required={!isEdit}
          />
        </div>
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

export function VendingMachinesListClient({ machines }: { machines: any[] }) {
  const [open, setOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<any | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this vending machine?")) return;
    const fd = new FormData();
    fd.append("id", id);
    startDeleteTransition(async () => {
      const res = await deleteVendingMachineAction(fd);
      if (res.ok) toast.success("Machine deleted");
      else toast.error(res.error || "Failed to delete");
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">All Machines</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingMachine(null);
            setOpen(true);
          }}
        >
          Add Machine
        </Button>
      </div>
      <div className="space-y-3">
        {machines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No machines yet.</p>
        ) : (
          machines.map((machine) => (
            <div
              key={machine._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{machine.names}</h3>
                <p className="text-xs text-muted-foreground">
                  {machine.location}, {machine.hostel}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {machine.id} · Items: {machine.items?.length || 0}
                </p>
              </div>
              <div className="flex gap-2 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingMachine(machine);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(machine.id)}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingMachine ? "Edit Machine" : "Add Machine"}
            </DialogTitle>
          </DialogHeader>
          <VendingMachineForm
            machine={editingMachine}
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
              setEditingMachine(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Saving machine...</p>
          </div>
        </div>
      )}
    </>
  );
}
