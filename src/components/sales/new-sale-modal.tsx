"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, calculateInstallment } from "@/lib/utils";
import type { Product, Customer } from "@/types";
import { PAYMENT_METHOD_LABELS, INSTALLMENT_CONFIGS } from "@/types";
import { Plus, X, Search, Loader2, Trash2, ShoppingCart, ChevronRight } from "lucide-react";

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
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function NewSaleModal({ open, onClose, onSaved }: Props) {
  const { get, post } = useApi();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [payments, setPayments] = useState<PaymentEntry[]>([{ method: "CASH", amount: "" }]);
  const [installmentIdx, setInstallmentIdx] = useState(0);
  const [step, setStep] = useState<"cart" | "payment">("cart");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      resetState();
      loadCustomers();
    }
  }, [open]);

  useEffect(() => {
    if (productQuery.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await get<unknown>(`/api/products?search=${encodeURIComponent(productQuery)}&limit=8`);
      if (data) setSearchResults((data as { data: Product[] }).data || []);
      setShowDropdown(true);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [productQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetState = () => {
    setCart([]);
    setSelectedCustomerId("");
    setDiscount("0");
    setNotes("");
    setPayments([{ method: "CASH", amount: "" }]);
    setInstallmentIdx(0);
    setStep("cart");
    setProductQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const loadCustomers = async () => {
    const { data } = await get<unknown>("/api/customers?limit=200");
    if (data) setCustomers((data as { data: Customer[] }).data || []);
  };

  const addToCart = (product: Product) => {
    setProductQuery("");
    setSearchResults([]);
    setShowDropdown(false);

    const existing = cart.findIndex((c) => c.productId === product.id);
    if (existing >= 0) {
      setCart(cart.map((c, i) => i === existing ? { ...c, quantity: c.quantity + 1 } : c));
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
    // Refocus input for next product
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const updateCart = (index: number, field: keyof CartItem, value: unknown) => {
    setCart(cart.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity - i.discount, 0);
  const totalDiscount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - totalDiscount);
  const totalCost = cart.reduce((s, i) => s + i.unitCost * i.quantity, 0);
  const profit = total - totalCost;

  const instCfg = INSTALLMENT_CONFIGS[installmentIdx];
  const instCalc = instCfg.installments > 1 ? calculateInstallment(total, instCfg.installments, instCfg.interestRate) : null;

  const totalPaid = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const chargeTotal = instCalc ? instCalc.totalWithInterest : total;
  const remaining = chargeTotal - totalPaid;

  // Auto-fill payment amount when moving to payment step
  const goToPayment = () => {
    setPayments([{ method: "CASH", amount: String(total) }]);
    setStep("payment");
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    const paymentData = payments
      .filter((p) => parseFloat(p.amount) > 0)
      .map((p) => ({
        method: p.method,
        amount: parseFloat(p.amount),
        installments: p.installments ?? null,
        interest: p.interest ?? null,
      }));

    if (paymentData.length === 0) {
      paymentData.push({ method: "CASH", amount: total, installments: null, interest: null });
    }

    const installmentPlan = instCalc && instCfg.installments > 1
      ? { installments: instCfg.installments, interestRate: instCfg.interestRate, installmentAmt: instCalc.monthly, totalWithInt: instCalc.totalWithInterest }
      : null;

    const { error } = await post("/api/sales", {
      customerId: selectedCustomerId || null,
      discount: totalDiscount,
      notes: notes || null,
      items: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        discount: item.discount,
      })),
      payments: paymentData,
      installmentPlan,
    });

    if (error) {
      alert("Error: " + error);
    } else {
      onSaved();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            {step === "cart" ? "Nueva Venta — Productos" : "Nueva Venta — Pago"}
          </DialogTitle>
        </DialogHeader>

        {step === "cart" ? (
          <div className="space-y-4">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label>Cliente (opcional)</Label>
              <Select
                value={selectedCustomerId || "__none__"}
                onValueChange={(v) => setSelectedCustomerId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cliente ocasional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Cliente ocasional</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` — ${c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Search */}
            <div className="space-y-1.5">
              <Label>Buscar y agregar productos</Label>
              <div ref={searchRef} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 animate-spin" />}
                <Input
                  ref={inputRef}
                  placeholder="Escribí el nombre o SKU del producto..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  className="pl-9"
                  autoComplete="off"
                />

                {/* Dropdown — inside the relative parent, no overflow clipping */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent blur before click
                          addToCart(p);
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">
                            {p.sku}
                            {p.category ? ` · ${p.category.name}` : ""}
                            {` · Stock: ${p.stock}`}
                          </p>
                        </div>
                        <span className="ml-3 shrink-0 font-semibold text-blue-600 text-sm">
                          {formatCurrency(Number(p.priceArs))}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && !searching && productQuery.length > 0 && searchResults.length === 0 && (
                  <div className="absolute left-0 right-0 top-full z-[100] mt-1 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl">
                    <p className="text-sm text-gray-400">No se encontraron productos para "<strong>{productQuery}</strong>"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            {cart.length > 0 ? (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                  <span className="col-span-5">Producto</span>
                  <span className="col-span-2 text-center">Cant.</span>
                  <span className="col-span-2 text-right">Precio</span>
                  <span className="col-span-2 text-right">Total</span>
                  <span className="col-span-1" />
                </div>

                {cart.map((item, i) => (
                  <div key={i} className="border-t border-gray-50 px-4 py-3">
                    {/* Mobile layout */}
                    <div className="flex items-start justify-between sm:hidden">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.description}</p>
                        <p className="text-xs text-gray-400">Costo: {formatCurrency(item.unitCost)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateCart(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            className="h-7 w-20 text-center text-sm"
                          />
                          <span className="text-xs text-gray-400">×</span>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateCart(i, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="h-7 w-28 text-right text-sm"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            = {formatCurrency(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(i)} className="ml-2 mt-0.5 text-gray-300 hover:text-red-400">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <p className="text-sm font-medium truncate">{item.description}</p>
                        <p className="text-xs text-gray-400">Costo: {formatCurrency(item.unitCost)}</p>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateCart(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          className="h-7 text-center text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateCart(i, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="h-7 text-right text-sm"
                        />
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => removeFromCart(i)} className="text-gray-300 hover:text-red-400 p-1">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-100 py-8 text-center">
                <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">Buscá un producto para agregarlo al carrito</p>
              </div>
            )}

            {/* Discount + Totals */}
            {cart.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-24 shrink-0 text-sm">Descuento</Label>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="pl-7 h-8 text-sm" min="0" />
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 p-4 space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal ({cart.length} ítem{cart.length !== 1 ? "s" : ""})</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Descuento</span>
                      <span>-{formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  <Separator className="bg-blue-200" />
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-lg text-blue-700">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Ganancia estimada</span>
                    <span>{formatCurrency(profit)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Payment Step */
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-blue-800">Resumen</p>
                <span className="text-lg font-bold text-blue-800">{formatCurrency(total)}</span>
              </div>
              <div className="space-y-1">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-blue-700">
                    <span>{item.quantity}× {item.description}</span>
                    <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Installments */}
            <div className="space-y-1.5">
              <Label>Modalidad de Pago</Label>
              <Select value={String(installmentIdx)} onValueChange={(v) => {
                const idx = parseInt(v);
                setInstallmentIdx(idx);
                const cfg = INSTALLMENT_CONFIGS[idx];
                const calc = cfg.installments > 1 ? calculateInstallment(total, cfg.installments, cfg.interestRate) : null;
                setPayments([{ method: cfg.installments > 1 ? "INSTALLMENTS" : "CASH", amount: String(calc ? calc.totalWithInterest : total) }]);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTALLMENT_CONFIGS.map((cfg, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {cfg.label}{cfg.interestRate > 0 ? ` (+${cfg.interestRate}% interés)` : " — Sin interés"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {instCalc && (
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-center">
                  <div>
                    <p className="text-xs text-amber-500">Cuota mensual</p>
                    <p className="font-bold text-amber-800 text-sm">{formatCurrency(instCalc.monthly)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-500">Interés</p>
                    <p className="font-bold text-amber-800 text-sm">{formatCurrency(instCalc.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-500">Total</p>
                    <p className="font-bold text-amber-800 text-sm">{formatCurrency(instCalc.totalWithInterest)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="space-y-2">
              <Label>Forma de Pago</Label>
              {payments.map((payment, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={payment.method} onValueChange={(v) => setPayments(payments.map((p, j) => j === i ? { ...p, method: v } : p))}>
                    <SelectTrigger className="w-40 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => setPayments(payments.map((p, j) => j === i ? { ...p, amount: e.target.value } : p))}
                      className="pl-7"
                      placeholder="0"
                    />
                  </div>
                  {payments.length > 1 && (
                    <button onClick={() => setPayments(payments.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPayments([...payments, { method: "TRANSFER", amount: "" }])}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Agregar medio de pago
              </Button>
            </div>

            {/* Change indicator */}
            <div className={`rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${remaining <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {remaining <= 0
                ? `✓ Vuelto: ${formatCurrency(Math.abs(remaining))}`
                : `Falta cobrar: ${formatCurrency(remaining)}`}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones..." />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          {step === "cart" ? (
            <Button onClick={goToPayment} disabled={cart.length === 0}>
              Continuar al Pago
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("cart")} disabled={loading}>
                Volver
              </Button>
              <Button onClick={handleSubmit} disabled={loading || cart.length === 0} variant="success">
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
