"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { Plus, Search, ShoppingCart, TrendingUp } from "lucide-react";
import { NewSaleModal } from "@/components/sales/new-sale-modal";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "secondary" | "destructive" | "warning" }> = {
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

      const monthStart = new Date();
      monthStart.setDate(1);
      const monthSales = salesData.filter((s) => new Date(s.saleDate) >= monthStart && s.status === "COMPLETED");
      setStats({
        revenue: monthSales.reduce((sum, s) => sum + Number(s.total), 0),
        profit: monthSales.reduce((sum, s) => sum + Number(s.profit), 0),
        count: monthSales.length,
      });
    }
    setLoading(false);
  }, [search, get]);

  useEffect(() => {
    const timeout = setTimeout(loadSales, 300);
    return () => clearTimeout(timeout);
  }, [loadSales]);

  const handleSaved = () => {
    setShowModal(false);
    loadSales();
    toast({ title: "Venta registrada exitosamente", variant: "default" });
  };

  return (
    <AppLayout title="Ventas">
      <div className="space-y-5 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Ventas del Mes</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.revenue)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.count} transacciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Ganancia del Mes</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.profit)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Neta después de costos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Ticket Promedio</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(stats.count > 0 ? stats.revenue / stats.count : 0)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Por transacción</p>
            </CardContent>
          </Card>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </div>

        {/* Table */}
        <Card>
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
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">No hay ventas registradas</p>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => {
                  const status = STATUS_LABELS[sale.status] || STATUS_LABELS.COMPLETED;
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
                          {sale.saleNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {sale.customer?.name || "Cliente ocasional"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(sale.saleDate, "time")}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {(sale.items || []).map((i) => i.product?.name || i.description).slice(0, 2).join(", ")}
                          {(sale.items?.length || 0) > 2 && ` +${(sale.items?.length || 0) - 2} más`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(sale.payments || []).map((p) => (
                            <Badge key={p.id} variant="secondary" className="text-xs">
                              {PAYMENT_METHOD_LABELS[p.method]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(sale.total))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-emerald-600 font-medium text-sm">
                          {formatCurrency(Number(sale.profit))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        <NewSaleModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      </div>
    </AppLayout>
  );
}
