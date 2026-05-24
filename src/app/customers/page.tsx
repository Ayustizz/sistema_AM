"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer } from "@/types";
import { Plus, Search, Users, Pencil, Loader2, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const { get, post, put } = useApi();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", phone: "", dni: "", address: "", city: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const { data } = await get<unknown>(`/api/customers?${params}`);
    if (data) {
      const d = data as { data: Customer[]; pagination: { total: number } };
      setCustomers(d.data || []);
      setTotal(d.pagination?.total || 0);
    }
    setLoading(false);
  }, [search, get]);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 300);
    return () => clearTimeout(t);
  }, [loadCustomers]);

  const openModal = (customer?: Customer) => {
    setEditCustomer(customer || null);
    setForm(customer
      ? { name: customer.name, email: customer.email || "", phone: customer.phone || "", dni: customer.dni || "", address: customer.address || "", city: customer.city || "", notes: customer.notes || "" }
      : { name: "", email: "", phone: "", dni: "", address: "", city: "", notes: "" }
    );
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = { ...form, email: form.email || null, phone: form.phone || null, dni: form.dni || null, address: form.address || null, city: form.city || null, notes: form.notes || null };
    const result = editCustomer
      ? await put(`/api/customers/${editCustomer.id}`, payload)
      : await post("/api/customers", payload);
    if (!result.error) {
      setShowModal(false);
      loadCustomers();
      toast({ title: "Cliente guardado" });
    } else {
      alert(result.error);
    }
    setSaving(false);
  };

  return (
    <AppLayout title="Clientes">
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{total} clientes</p>
          <Button onClick={() => openModal()} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Cliente</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Mobile: cards */}
        <div className="block lg:hidden space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-20" /></Card>)
          ) : customers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">No hay clientes</p>
            </div>
          ) : (
            customers.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        {c.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Phone className="h-3 w-3" />{c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Mail className="h-3 w-3" />{c.email}
                          </div>
                        )}
                        <div className="mt-2 flex gap-4 text-xs">
                          <div>
                            <span className="text-gray-400">Gastado: </span>
                            <span className="font-medium">{formatCurrency(Number(c.totalSpent))}</span>
                          </div>
                          {Number(c.debt) > 0 && (
                            <div>
                              <span className="text-gray-400">Deuda: </span>
                              <span className="font-medium text-red-600">{formatCurrency(Number(c.debt))}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => openModal(c)} className="shrink-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <Card className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead className="text-right">Total Gastado</TableHead>
                <TableHead className="text-right">Deuda</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(8)].map((_, j) => <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>)}</TableRow>)
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-16 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-gray-300" /><p className="text-sm text-gray-400">No hay clientes</p></TableCell></TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">{c.name.charAt(0).toUpperCase()}</div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><div className="text-sm">{c.phone && <div className="text-gray-600">{c.phone}</div>}{c.email && <div className="text-gray-400 text-xs">{c.email}</div>}</div></TableCell>
                    <TableCell className="text-sm text-gray-500">{c.dni || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-500">{c.city || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(c.totalSpent))}</TableCell>
                    <TableCell className="text-right"><span className={`text-sm font-medium ${Number(c.debt) > 0 ? "text-red-600" : "text-gray-400"}`}>{Number(c.debt) > 0 ? formatCurrency(Number(c.debt)) : "—"}</span></TableCell>
                    <TableCell className="text-sm text-gray-400">{formatDate(c.createdAt)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon-sm" onClick={() => openModal(c)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={showModal} onOpenChange={(o) => !o && setShowModal(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editCustomer ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" /></div>
              <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+54 11 ..." /></div>
              <div className="space-y-1.5"><Label>DNI</Label><Input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} placeholder="12.345.678" /></div>
              <div className="space-y-1.5"><Label>Ciudad</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Buenos Aires" /></div>
              <div className="col-span-2 space-y-1.5"><Label>Notas</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas internas..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.name}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
