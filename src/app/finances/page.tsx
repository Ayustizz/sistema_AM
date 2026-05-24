"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";
import { EXPENSE_CATEGORY_LABELS } from "@/types";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function FinancesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { get, post } = useApi();
  const { toast } = useToast();

  const [form, setForm] = useState({ category: "OTHER", description: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const monthStart = new Date(); monthStart.setDate(1);
    const { data } = await get<unknown>(`/api/finances?from=${monthStart.toISOString()}`);
    if (data) {
      const d = data as { data: Expense[]; totalAmount: number; byCategory: Record<string, number> };
      setExpenses(d.data || []);
      setTotalExpenses(d.totalAmount || 0);
      setByCategory(d.byCategory || {});
    }
    setLoading(false);
  }, [get]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.description || !form.amount) return;
    setSaving(true);
    const { error } = await post("/api/finances", {
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      notes: form.notes || null,
    });
    if (!error) {
      setShowModal(false);
      load();
      toast({ title: "Gasto registrado" });
      setForm({ category: "OTHER", description: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
    } else {
      alert(error);
    }
    setSaving(false);
  };

  const pieData = Object.entries(byCategory).map(([cat, amount]) => ({
    name: EXPENSE_CATEGORY_LABELS[cat as keyof typeof EXPENSE_CATEGORY_LABELS] || cat,
    value: amount,
  }));

  return (
    <AppLayout title="Finanzas">
      <div className="space-y-4 animate-fade-in">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 lg:p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Gastos del Mes</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{expenses.length} registros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 lg:p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Mayor categoría</p>
              <p className="text-sm font-bold mt-1 truncate">
                {pieData.length > 0
                  ? EXPENSE_CATEGORY_LABELS[Object.keys(byCategory).reduce((a, b) => byCategory[a] > byCategory[b] ? a : b) as keyof typeof EXPENSE_CATEGORY_LABELS]
                  : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 lg:p-5">
              <p className="text-xs text-gray-500 uppercase font-medium">Promedio</p>
              <p className="text-lg font-bold mt-1 truncate">
                {formatCurrency(expenses.length > 0 ? totalExpenses / expenses.length : 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Gastos del mes</h2>
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Expenses — mobile cards + desktop table */}
          <div className="lg:col-span-2">
            {/* Mobile */}
            <div className="block lg:hidden space-y-2">
              {loading ? (
                [...Array(3)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-16" /></Card>)
              ) : expenses.map((e) => (
                <Card key={e.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{e.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{EXPENSE_CATEGORY_LABELS[e.category]}</Badge>
                          <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                        </div>
                      </div>
                      <p className="ml-3 shrink-0 font-bold text-red-600">-{formatCurrency(Number(e.amount))}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!loading && expenses.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">No hay gastos este mes</p>
              )}
            </div>
            {/* Desktop */}
            <Card className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(4)].map((_, j) => <TableCell key={j}><div className="h-4 rounded bg-gray-100 animate-pulse" /></TableCell>)}</TableRow>)
                  ) : expenses.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-gray-400">No hay gastos este mes</TableCell></TableRow>
                  ) : (
                    expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell><p className="text-sm font-medium">{e.description}</p>{e.notes && <p className="text-xs text-gray-400">{e.notes}</p>}</TableCell>
                        <TableCell><Badge variant="secondary">{EXPENSE_CATEGORY_LABELS[e.category]}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-400">{formatDate(e.date)}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">-{formatCurrency(Number(e.amount))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Pie Chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Por Categoría</CardTitle></CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Legend iconSize={8} formatter={(value) => <span className="text-xs">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-gray-400">Sin datos</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showModal} onOpenChange={(o) => !o && setShowModal(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Categoría *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Descripción *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Alquiler local..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Monto *</Label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="pl-7" placeholder="0" /></div>
                </div>
                <div className="space-y-1.5"><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.description || !form.amount}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
