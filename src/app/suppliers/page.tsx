"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import type { Supplier } from "@/types";
import { Plus, Search, Truck, Pencil, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const { get, post, put } = useApi();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "", address: "", website: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const { data } = await get<unknown>(`/api/suppliers?${params}`);
    if (data) setSuppliers((data as { data: Supplier[] }).data || []);
    setLoading(false);
  }, [search, get]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openModal = (s?: Supplier) => {
    setEditSupplier(s || null);
    setForm(s
      ? { name: s.name, contact: s.contact || "", email: s.email || "", phone: s.phone || "", address: s.address || "", website: s.website || "", notes: s.notes || "" }
      : { name: "", contact: "", email: "", phone: "", address: "", website: "", notes: "" }
    );
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = { ...form, contact: form.contact || null, email: form.email || null, phone: form.phone || null, address: form.address || null, website: form.website || null, notes: form.notes || null };
    const result = editSupplier
      ? await put(`/api/suppliers/${editSupplier.id}`, payload)
      : await post("/api/suppliers", payload);
    if (!result.error) {
      setShowModal(false);
      load();
      toast({ title: "Proveedor guardado" });
    } else {
      alert(result.error);
    }
    setSaving(false);
  };

  return (
    <AppLayout title="Proveedores">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{suppliers.length} proveedores</p>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Sitio Web</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => <TableRow key={i}>{[...Array(6)].map((_, j) => <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>)}</TableRow>)
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <Truck className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">No hay proveedores</p>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{s.contact || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{s.phone || "—"}</TableCell>
                    <TableCell>
                      {s.website ? (
                        <a href={s.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Sitio
                        </a>
                      ) : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">{formatDate(s.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" onClick={() => openModal(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={showModal} onOpenChange={(o) => !o && setShowModal(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del proveedor" />
              </div>
              <div className="space-y-1.5">
                <Label>Persona de Contacto</Label>
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Nombre..." />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+54 11 ..." />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@proveedor.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Sitio Web</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Dirección</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección..." />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notas</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Condiciones de pago, plazo de entrega..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.name}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
