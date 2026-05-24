"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";
import { BarChart3, Download, TrendingUp, Package, AlertTriangle } from "lucide-react";

interface SalesReport {
  data: Sale[];
  totals: { revenue: number; profit: number; cost: number; count: number };
}

interface ProductReport {
  data: Array<{
    product: { id: string; name: string; sku: string; category: { name: string } | null };
    quantity: number;
    revenue: number;
    orders: number;
  }>;
}

interface StockReport {
  data: Array<{ id: string; name: string; sku: string; stock: number; minStock: number; priceArs: number; category: { name: string } | null; brand: { name: string } | null }>;
  lowStock: number;
  outOfStock: number;
  total: number;
}

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [productReport, setProductReport] = useState<ProductReport | null>(null);
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [loading, setLoading] = useState(false);
  const { get } = useApi();

  const loadReports = async () => {
    setLoading(true);
    const [sales, products, stock] = await Promise.all([
      get<unknown>(`/api/reports?type=sales&from=${from}&to=${to}`),
      get<unknown>(`/api/reports?type=products&from=${from}&to=${to}`),
      get<unknown>("/api/reports?type=stock"),
    ]);

    if (sales.data) setSalesReport(sales.data as SalesReport);
    if (products.data) setProductReport(products.data as ProductReport);
    if (stock.data) setStockReport(stock.data as StockReport);
    setLoading(false);
  };

  useEffect(() => { loadReports(); }, []);

  return (
    <AppLayout title="Reportes">
      <div className="space-y-5 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Desde:</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36 h-8 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Hasta:</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36 h-8 text-sm" />
          </div>
          <Button onClick={loadReports} disabled={loading} size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Generar Reporte
          </Button>
        </div>

        {/* Sales Summary */}
        {salesReport && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Ventas</p>
                <p className="text-xl font-bold">{salesReport.totals.count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Ingresos</p>
                <p className="text-xl font-bold">{formatCurrency(salesReport.totals.revenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Costo Total</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(salesReport.totals.cost)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Ganancia Neta</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(salesReport.totals.profit)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="sales">
          <TabsList>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Venta</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(7)].map((_, j) => <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>)}</TableRow>)
                  ) : (salesReport?.data || []).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell><code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">{sale.saleNumber}</code></TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(sale.saleDate, "time")}</TableCell>
                      <TableCell className="text-sm">{sale.customer?.name || "Ocasional"}</TableCell>
                      <TableCell className="text-sm">{sale.user?.name || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(sale.total))}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatCurrency(Number(sale.profit))}</TableCell>
                      <TableCell><Badge variant="success">Completada</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Unidades</TableHead>
                    <TableHead className="text-center">Pedidos</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>)}</TableRow>)
                  ) : (productReport?.data || []).map((p, i) => (
                    <TableRow key={p.product?.id || i}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.product?.name || "Desconocido"}</p>
                          <code className="text-xs text-gray-400">{p.product?.sku}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.product?.category ? (
                          <Badge variant="secondary">{p.product.category.name}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-center font-semibold">{p.quantity}</TableCell>
                      <TableCell className="text-center">{p.orders}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="stock">
            <div className="mb-3 flex gap-3">
              {stockReport && (
                <>
                  <Card className="flex-1">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Total productos</p>
                        <p className="font-bold">{stockReport.total}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-xs text-gray-500">Stock bajo</p>
                        <p className="font-bold text-amber-600">{stockReport.lowStock}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-500">Sin stock</p>
                        <p className="font-bold text-red-600">{stockReport.outOfStock}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(7)].map((_, j) => <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>)}</TableRow>)
                  ) : (stockReport?.data || []).map((p) => {
                    const isLow = p.stock <= p.minStock;
                    const isOut = p.stock === 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            <code className="text-xs text-gray-400">{p.sku}</code>
                          </div>
                        </TableCell>
                        <TableCell>{p.category?.name ? <Badge variant="secondary">{p.category.name}</Badge> : "—"}</TableCell>
                        <TableCell className="text-sm text-gray-500">{p.brand?.name || "—"}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-700"}`}>
                            {p.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-gray-400">{p.minStock}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(Number(p.priceArs))}</TableCell>
                        <TableCell>
                          {isOut ? <Badge variant="destructive">Sin stock</Badge>
                            : isLow ? <Badge variant="warning">Stock bajo</Badge>
                            : <Badge variant="success">OK</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
