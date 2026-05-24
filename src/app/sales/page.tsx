"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { NewSaleModal } from "@/components/sales/new-sale-modal";
import { useToast } from "@/hooks/use-toast";

const STATUS: Record<string, { label: string; variant: "success" | "secondary" | "destructive" | "warning" }> = {
  COMPLETED: { label: "Completada", variant: "success" },
  PENDING: { label: "Pendiente", variant: "warning" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
  REFUNDED: { label: "Devuelta", variant: "secondary" },
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ revenue: 0, profit: 0, count: 0 });
  const { get } = useApi();
  const { toast } = useToast();

  const loadSales = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const { data } = await get<unknown>(`/api/sales?${params}`);
    if (data) {
      const d = data as { data: Sale[]; pagination: { total: number } };
      const salesData = d.data || [];
      setSales(salesData);
      setTotal(d.pagination?.total || 0);
      const monthStart = new Date(); monthStart.setDate(1);
      const m = salesData.filter((s) => new Date(s.saleDate) >= monthStart && s.status === "COMPLETED");
      setStats({
        revenue: m.reduce((s, x) => s + Number(x.total), 0),
        profit: m.reduce((s, x) => s + Number(x.profit), 0),
        count: m.length,
      });
    }
    setLoading(false);
  }, [search, get]);

  useEffect(() => {
    const t = setTimeout(loadSales, 300);
    return () => clearTimeout(t);
  }, [loadSales]);

  const handleSaved = () => {
    setShowModal(false);
    loadSales();
    toast({ title: "Venta registrada exitosamente" });
  };

  return (
    <AppLayout title="Ventas">
      <div className="space-y-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 lg:p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Ventas mes</p>
              <p className="text-lg lg:text-2xl font-bold mt-1 truncate">{formatCurrency(stats.revenue)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.count} transac.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 lg:p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Ganancia</p>
              <p className="text-lg lg:text-2xl font-bold text-emerald-600 mt-1 truncate">{formatCurrency(stats.profit)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Neta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 lg:p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Ticket prom.</p>
              <p className="text-lg lg:text-2xl font-bold mt-1 truncate">
                {formatCurrency(stats.count > 0 ? stats.revenue / stats.count : 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Buscar venta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setShowModal(true)} size="sm" className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Nueva Venta</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>

        {/* Mobile: cards */}
        <div className="block lg:hidden space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-24" /></Card>)
          ) : sales.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">No hay ventas</p>
            </div>
          ) : (
            sales.map((sale) => {
              const status = STATUS[sale.status] || STATUS.COMPLETED;
              return (
                <Card key={sale.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5 font-mono">{sale.saleNumber}</code>
                          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                        </div>
                        <p className="mt-1 font-medium text-gray-900">{sale.customer?.name || "Ocasional"}</p>
                        <p className="text-xs text-gray-400">{formatDate(sale.saleDate, "time")}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(sale.payments || []).map((p) => (
                            <Badge key={p.id} variant="secondary" className="text-xs">{PAYMENT_METHOD_LABELS[p.method]}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="ml-3 text-right shrink-0">
                        <p className="font-bold text-gray-900">{formatCurrency(Number(sale.total))}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">{formatCurrency(Number(sale.profit))}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Desktop: table */}
        <Card className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(8)].map((_, j) => <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>)}</TableRow>)
              ) : sales.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-16 text-center"><ShoppingCart className="mx-auto mb-3 h-8 w-8 text-gray-300" /><p className="text-sm text-gray-400">No hay ventas</p></TableCell></TableRow>
              ) : (
                sales.map((sale) => {
                  const status = STATUS[sale.status] || STATUS.COMPLETED;
                  return (
                    <TableRow key={sale.id}>
                      <TableCell><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">{sale.saleNumber}</code></TableCell>
                      <TableCell className="text-sm font-medium">{sale.customer?.name || "Ocasional"}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(sale.saleDate, "time")}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                        {(sale.items || []).map((i) => i.product?.name || i.description).slice(0, 2).join(", ")}
                        {(sale.items?.length || 0) > 2 && ` +${(sale.items?.length || 0) - 2}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(sale.payments || []).map((p) => <Badge key={p.id} variant="secondary" className="text-xs">{PAYMENT_METHOD_LABELS[p.method]}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(sale.total))}</TableCell>
                      <TableCell className="text-right"><span className="text-emerald-600 font-medium text-sm">{formatCurrency(Number(sale.profit))}</span></TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        <NewSaleModal open={showModal} onClose={() => setShowModal(false)} onSaved={handleSaved} />
      </div>
    </AppLayout>
  );
}
