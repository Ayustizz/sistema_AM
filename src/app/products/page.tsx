"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { Plus, Search, Package, AlertTriangle, Pencil, Eye, Filter } from "lucide-react";
import { ProductFormModal } from "@/components/products/product-form-modal";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  ACTIVE: { label: "Activo", variant: "success" },
  INACTIVE: { label: "Inactivo", variant: "secondary" },
  DISCONTINUED: { label: "Descontinuado", variant: "destructive" },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const { get } = useApi();
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (lowStockOnly) params.set("lowStock", "true");

    const { data } = await get<{ data: Product[]; pagination: { total: number } }>(`/api/products?${params}`);
    if (data) {
      setProducts((data as unknown as { data: Product[]; pagination: { total: number } }).data || (data as unknown as Product[]));
      setTotal((data as unknown as { data: Product[]; pagination: { total: number } }).pagination?.total || 0);
    }
    setLoading(false);
  }, [search, lowStockOnly, get]);

  useEffect(() => {
    const timeout = setTimeout(loadProducts, 300);
    return () => clearTimeout(timeout);
  }, [loadProducts]);

  const handleSaved = () => {
    setShowModal(false);
    setEditProduct(null);
    loadProducts();
    toast({ title: "Producto guardado", variant: "default" });
  };

  return (
    <AppLayout title="Productos">
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{total} productos en total</p>
          </div>
          <Button onClick={() => { setEditProduct(null); setShowModal(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, SKU, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={lowStockOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            <AlertTriangle className="mr-1.5 h-4 w-4" />
            Stock bajo
          </Button>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Costo USD</TableHead>
                <TableHead className="text-right">Precio ARS</TableHead>
                <TableHead className="text-right">Margen</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 rounded bg-gray-100 animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-16 text-center">
                    <Package className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">No hay productos</p>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const status = STATUS_LABELS[product.status];
                  const isLowStock = product.stock <= product.minStock;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.brand && (
                            <p className="text-xs text-gray-400">{product.brand.name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          {product.sku}
                        </code>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="secondary">{product.category.name}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(Number(product.costUsd), "USD")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatCurrency(Number(product.priceArs))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-medium ${Number(product.profitMargin) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {Number(product.profitMargin).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${isLowStock ? "text-amber-600" : "text-gray-700"}`}>
                          {isLowStock && <AlertTriangle className="h-3.5 w-3.5" />}
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => { setEditProduct(product); setShowModal(true); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        <ProductFormModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSaved={handleSaved}
          product={editProduct}
        />
      </div>
    </AppLayout>
  );
}
