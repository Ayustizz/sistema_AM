"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category, Brand, Supplier } from "@/types";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
}

export function ProductFormModal({ open, onClose, onSaved, product }: Props) {
  const { get, post, put } = useApi();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [exchangeRate, setExchangeRate] = useState(1000);

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    supplierId: "",
    costUsd: "",
    costArs: "",
    priceArs: "",
    stock: "0",
    minStock: "1",
    status: "ACTIVE",
    barcode: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
      if (product) {
        setForm({
          name: product.name,
          description: product.description || "",
          categoryId: product.categoryId || "",
          brandId: product.brandId || "",
          supplierId: product.supplierId || "",
          costUsd: String(product.costUsd),
          costArs: String(product.costArs),
          priceArs: String(product.priceArs),
          stock: String(product.stock),
          minStock: String(product.minStock),
          status: product.status,
          barcode: product.barcode || "",
        });
      } else {
        setForm({
          name: "",
          description: "",
          categoryId: "",
          brandId: "",
          supplierId: "",
          costUsd: "",
          costArs: "",
          priceArs: "",
          stock: "0",
          minStock: "1",
          status: "ACTIVE",
          barcode: "",
        });
      }
    }
  }, [open, product]);

  const loadData = async () => {
    const [catRes, brandRes, suppRes, rateRes] = await Promise.all([
      get<{ data: Category[] }>("/api/categories"),
      get<{ data: Brand[] }>("/api/brands"),
      get<{ data: Supplier[] }>("/api/suppliers"),
      get<{ data: Array<{ usdToArs: number }> }>("/api/currency"),
    ]);
    if (catRes.data) setCategories((catRes.data as unknown as { data: Category[] }).data || []);
    if (brandRes.data) setBrands((brandRes.data as unknown as { data: Brand[] }).data || []);
    if (suppRes.data) setSuppliers((suppRes.data as unknown as { data: Supplier[] }).data || []);
    if (rateRes.data) {
      const rates = (rateRes.data as unknown as { data: Array<{ usdToArs: number }> }).data || [];
      if (rates.length > 0) setExchangeRate(Number(rates[0].usdToArs));
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate costArs from costUsd
      if (field === "costUsd" && value && exchangeRate) {
        updated.costArs = (parseFloat(value) * exchangeRate).toFixed(0);
      }

      return updated;
    });
  };

  const profitMargin =
    form.priceArs && form.costArs && parseFloat(form.costArs) > 0
      ? (((parseFloat(form.priceArs) - parseFloat(form.costArs)) / parseFloat(form.costArs)) * 100).toFixed(1)
      : "0";

  const profitAmount =
    form.priceArs && form.costArs
      ? parseFloat(form.priceArs) - parseFloat(form.costArs)
      : 0;

  const handleSubmit = async () => {
    if (!form.name || !form.priceArs) return;
    setLoading(true);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      categoryId: form.categoryId || null,
      brandId: form.brandId || null,
      supplierId: form.supplierId || null,
      costUsd: parseFloat(form.costUsd) || 0,
      costArs: parseFloat(form.costArs) || 0,
      priceArs: parseFloat(form.priceArs),
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 1,
      status: form.status,
      barcode: form.barcode || null,
    };

    const result = product
      ? await put(`/api/products/${product.id}`, payload)
      : await post("/api/products", payload);

    if (result.error) {
      alert(result.error);
    } else {
      onSaved();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Información</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1">Precios</TabsTrigger>
            <TabsTrigger value="stock" className="flex-1">Stock</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ej: iPhone 15 Pro 128GB"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Descripción del producto..."
                rows={3}
                className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={form.categoryId} onValueChange={(v) => handleChange("categoryId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Select value={form.brandId} onValueChange={(v) => handleChange("brandId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Proveedor</Label>
                <Select value={form.supplierId} onValueChange={(v) => handleChange("supplierId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Código de Barras</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  placeholder="EAN-13, UPC..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4 pt-4">
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Cotización actual: <strong>1 USD = ${exchangeRate.toLocaleString("es-AR")} ARS</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Costo en USD</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    type="number"
                    value={form.costUsd}
                    onChange={(e) => handleChange("costUsd", e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Costo en ARS</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    type="number"
                    value={form.costArs}
                    onChange={(e) => handleChange("costArs", e.target.value)}
                    placeholder="0"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Precio de Venta ARS *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <Input
                  type="number"
                  value={form.priceArs}
                  onChange={(e) => handleChange("priceArs", e.target.value)}
                  placeholder="0"
                  className="pl-7 text-lg font-semibold"
                />
              </div>
            </div>

            {/* Profit Preview */}
            {form.priceArs && form.costArs && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase">Análisis de Rentabilidad</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Ganancia</p>
                    <p className={`text-lg font-bold ${profitAmount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {formatCurrency(profitAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Margen</p>
                    <p className={`text-lg font-bold ${parseFloat(profitMargin) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {profitMargin}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">En USD</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(profitAmount / exchangeRate, "USD")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stock Inicial</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => handleChange("stock", e.target.value)}
                  min="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Stock Mínimo</Label>
                <Input
                  type="number"
                  value={form.minStock}
                  onChange={(e) => handleChange("minStock", e.target.value)}
                  min="0"
                />
                <p className="text-xs text-gray-400">Alerta cuando el stock baje de este número</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.name || !form.priceArs}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {product ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
