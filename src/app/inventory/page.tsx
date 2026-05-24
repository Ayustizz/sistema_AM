"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import type { StockMovement, Product } from "@/types";
import { MOVEMENT_TYPE_LABELS } from "@/types";
import { Plus, Search, Boxes, Loader2, ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TYPE_STYLES: Record<string, { icon: React.ElementType; color: string; variant: "success" | "destructive" | "secondary" | "warning" }> = {
  IN: { icon: ArrowDown, color: "text-emerald-600", variant: "success" },
  OUT: { icon: ArrowUp, color: "text-red-500", variant: "destructive" },
  ADJUSTMENT: { icon: ArrowLeftRight, color: "text-blue-600", variant: "secondary" },
  RETURN: { icon: ArrowDown, color: "text-purple-600", variant: "secondary" },
  TRANSFER: { icon: ArrowLeftRight, color: "text-amber-600", variant: "warning" },
};

export default function InventoryPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { get, post } = useApi();
  const { toast } = useToast();

  const [form, setForm] = useState({ productId: "", type: "IN", quantity: "1", reason: "", reference: "" });
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await get<unknown>("/api/inventory?limit=50");
    if (data) {
      const d = data as { data: StockMovement[]; pagination: { total: number } };
      setMovements(d.data || []);
      setTotal(d.pagination?.total || 0);
    }
    setLoading(false);
  }, [get]);

  useEffect(() => { load(); }, [load]);

  const searchProducts = async (q: string) => {
    if (q.length < 1) return;
    const { data } = await get<unknown>(`/api/products?search=${q}&limit=10`);
    if (data) setProducts((data as { data: Product[] }).data || []);
  };

  const handleSave = async () => {
    if (!form.productId || !form.quantity) return;
    setSaving(true);
    const { error } = await post("/api/inventory", {
      productId: form.productId,
      type: form.type,
      quantity: parseInt(form.quantity),
      reason: form.reason || undefined,
      reference: form.reference || undefined,
    });
    if (!error) {
      setShowModal(false);
      load();
      toast({ title: "Movimiento registrado" });
      setForm({ productId: "", type: "IN", quantity: "1", reason: "", reference: "" });
      setProductSearch("");
    } else {
      alert(error);
    }
    setSaving(false);
  };

  const selectedProduct = products.find((p) => p.id === form.productId);

  return (
    <AppLayout title="Inventario">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} movimientos registrados</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Movimiento
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-center">Stock Anterior</TableHead>
                <TableHead className="text-center">Stock Nuevo</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(8)].map((_, i) => <TableRow key={i}>{[...Array(8)].map((_, j) => <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>)}</TableRow>)
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <Boxes className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">No hay movimientos de stock</p>
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => {
                  const typeStyle = TYPE_STYLES[m.type] || TYPE_STYLES.ADJUSTMENT;
                  const Icon = typeStyle.icon;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-4 w-4 ${typeStyle.color}`} />
                          <Badge variant={typeStyle.variant as "success" | "destructive" | "secondary"}>
                            {MOVEMENT_TYPE_LABELS[m.type]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{m.product?.name}</p>
                          <code className="text-xs text-gray-400">{m.product?.sku}</code>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${typeStyle.color}`}>
                          {m.type === "OUT" ? "-" : "+"}{m.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-gray-500">{m.previousQty}</TableCell>
                      <TableCell className="text-center font-medium">{m.newQty}</TableCell>
                      <TableCell>
                        {m.reference ? (
                          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{m.reference}</code>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{m.reason || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-400">{formatDate(m.createdAt, "time")}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={showModal} onOpenChange={(o) => !o && setShowModal(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Movimiento de Stock</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Producto *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
                    placeholder="Buscar producto..."
                    className="pl-9"
                  />
                </div>
                {products.length > 0 && !form.productId && (
                  <div className="rounded-lg border border-gray-100 bg-white shadow">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setForm({ ...form, productId: p.id }); setProductSearch(p.name); setProducts([]); }}
                        className="flex w-full items-center justify-between px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                      >
                        <span>{p.name}</span>
                        <span className="text-gray-400">Stock: {p.stock}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedProduct && (
                  <p className="text-xs text-blue-600">Stock actual: {selectedProduct.stock} unidades</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Cantidad *</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
              </div>

              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ej: Compra, ajuste de inventario..." />
              </div>

              <div className="space-y-1.5">
                <Label>Referencia</Label>
                <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="N° de factura, etc..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.productId}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
