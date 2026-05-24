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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, calculateInstallment } from "@/lib/utils";
import type { Product, Customer } from "@/types";
import { PAYMENT_METHOD_LABELS, INSTALLMENT_CONFIGS } from "@/types";
import { Plus, X, Search, Loader2, Trash2 } from "lucide-react";

interface CartItem {
  productId: string;
  variantId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
}

interface PaymentEntry {
  method: string;
  amount: string;
  installments?: number;
  interest?: number;
  reference?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function NewSaleModal({ open, onClose, onSaved }: Props) {
  const { get, post } = useApi();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { method: "CASH", amount: "" },
  ]);
  const [installmentConfig, setInstallmentConfig] = useState(0);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [step, setStep] = useState<"cart" | "payment">("cart");

  useEffect(() => {
    if (open) {
      setCart([]);
      setSelectedCustomerId("");
      setDiscount("0");
      setNotes("");
      setPayments([{ method: "CASH", amount: "" }]);
      setInstallmentConfig(0);
      setStep("cart");
      loadCustomers();
    }
  }, [open]);

  useEffect(() => {
    if (productSearch.length >= 1) {
      const timeout = setTimeout(searchProducts, 300);
      return () => clearTimeout(timeout);
    } else {
      setProducts([]);
    }
  }, [productSearch]);

  const searchProducts = async () => {
    const { data } = await get<unknown>(`/api/products?search=${productSearch}&limit=10`);
    if (data) {
      setProducts((data as { data: Product[] }).data || []);
    }
  };

  const loadCustomers = async () => {
    const { data } = await get<unknown>("/api/customers?limit=100");
    if (data) setCustomers((data as { data: Customer[] }).data || []);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((c) => c.productId === product.id && !c.variantId);
    if (existing) {
      setCart(cart.map((c) =>
        c.productId === product.id && !c.variantId
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: Number(product.priceArs),
        unitCost: Number(product.costArs),
        discount: 0,
      }]);
    }
    setProductSearch("");
    setProducts([]);
    setShowProductSearch(false);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: unknown) => {
    setCart(cart.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity - item.discount, 0);
  const totalDiscount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - totalDiscount);
  const totalCost = cart.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const profit = total - totalCost;

  const selectedInstConfig = INSTALLMENT_CONFIGS[installmentConfig];
  const installmentCalc = selectedInstConfig && selectedInstConfig.installments > 1
    ? calculateInstallment(total, selectedInstConfig.installments, selectedInstConfig.interestRate)
    : null;

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = installmentCalc ? installmentCalc.totalWithInterest - totalPaid : total - totalPaid;

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    const paymentData = payments
      .filter((p) => parseFloat(p.amount) > 0)
      .map((p) => ({
        method: p.method,
        amount: parseFloat(p.amount),
        installments: p.installments,
        interest: p.interest,
        reference: p.reference,
      }));

    const installmentPlan =
      installmentCalc && selectedInstConfig.installments > 1
        ? {
            installments: selectedInstConfig.installments,
            interestRate: selectedInstConfig.interestRate,
            installmentAmt: installmentCalc.monthly,
            totalWithInt: installmentCalc.totalWithInterest,
          }
        : null;

    const { error } = await post("/api/sales", {
      customerId: selectedCustomerId || null,
      discount: totalDiscount,
      notes: notes || null,
      items: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        discount: item.discount,
      })),
      payments: paymentData.length > 0 ? paymentData : [{ method: "CASH", amount: total }],
      installmentPlan,
    });

    if (error) {
      alert(error);
    } else {
      onSaved();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>

        {step === "cart" ? (
          <div className="space-y-4">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label>Cliente (opcional)</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Cliente ocasional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cliente ocasional</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Search */}
            <div className="space-y-1.5">
              <Label>Agregar Productos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar producto por nombre o SKU..."
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setShowProductSearch(true); }}
                  onFocus={() => setShowProductSearch(true)}
                  className="pl-9"
                />
              </div>

              {showProductSearch && products.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-w-lg rounded-lg border border-gray-100 bg-white shadow-lg">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku} · Stock: {p.stock}</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">{formatCurrency(Number(p.priceArs))}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase grid grid-cols-12 gap-2">
                  <span className="col-span-5">Producto</span>
                  <span className="col-span-2 text-center">Cant.</span>
                  <span className="col-span-2 text-right">Precio</span>
                  <span className="col-span-2 text-right">Total</span>
                  <span className="col-span-1" />
                </div>
                {cart.map((item, i) => (
                  <div key={i} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center border-t border-gray-50">
                    <div className="col-span-5">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      <p className="text-xs text-gray-400">Costo: {formatCurrency(item.unitCost)}</p>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCartItem(i, "quantity", parseInt(e.target.value) || 1)}
                        min="1"
                        className="h-7 text-center text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateCartItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="h-7 text-right text-sm"
                      />
                    </div>
                    <div className="col-span-2 text-right text-sm font-medium">
                      {formatCurrency(item.unitPrice * item.quantity - item.discount)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon-sm" onClick={() => removeFromCart(i)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Discount */}
            <div className="flex items-center gap-3">
              <Label className="w-24">Descuento</Label>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="pl-7 h-8"
                  min="0"
                />
              </div>
            </div>

            {/* Totals Preview */}
            {cart.length > 0 && (
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Descuento</span>
                    <span>-{formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-lg">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Ganancia estimada</span>
                  <span>{formatCurrency(profit)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Payment Step */
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">Resumen del Pedido</p>
              <div className="mt-2 space-y-1">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-blue-700">
                    <span>{item.quantity}x {item.description}</span>
                    <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-2 bg-blue-200" />
              <div className="flex justify-between font-bold text-blue-900">
                <span>Total a cobrar</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Installments */}
            <div className="space-y-1.5">
              <Label>Método de Pago / Cuotas</Label>
              <Select
                value={String(installmentConfig)}
                onValueChange={(v) => setInstallmentConfig(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTALLMENT_CONFIGS.map((cfg, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {cfg.label}
                      {cfg.interestRate > 0 ? ` (+${cfg.interestRate}% interés)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {installmentCalc && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-amber-600">Cuota mensual</p>
                      <p className="font-bold text-amber-800">{formatCurrency(installmentCalc.monthly)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600">Interés total</p>
                      <p className="font-bold text-amber-800">{formatCurrency(installmentCalc.totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600">Total con interés</p>
                      <p className="font-bold text-amber-800">{formatCurrency(installmentCalc.totalWithInterest)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="space-y-2">
              <Label>Desglose de Pagos</Label>
              {payments.map((payment, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={payment.method} onValueChange={(v) => {
                    setPayments(payments.map((p, j) => j === i ? { ...p, method: v } : p));
                  }}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => {
                        setPayments(payments.map((p, j) => j === i ? { ...p, amount: e.target.value } : p));
                      }}
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                  {payments.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setPayments(payments.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPayments([...payments, { method: "CASH", amount: "" }])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Agregar medio de pago
              </Button>
            </div>

            {/* Change */}
            <div className={`rounded-lg p-3 text-center ${remaining <= 0 ? "bg-emerald-50" : "bg-amber-50"}`}>
              {remaining <= 0 ? (
                <p className="text-sm font-semibold text-emerald-700">
                  Vuelto: {formatCurrency(Math.abs(remaining))}
                </p>
              ) : (
                <p className="text-sm font-semibold text-amber-700">
                  Falta: {formatCurrency(remaining)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones opcionales..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          {step === "cart" ? (
            <Button
              onClick={() => setStep("payment")}
              disabled={cart.length === 0}
            >
              Continuar al Pago
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("cart")}>
                Volver
              </Button>
              <Button onClick={handleSubmit} disabled={loading || cart.length === 0}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar Venta
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
