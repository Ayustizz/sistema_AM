"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExchangeRate } from "@/types";
import { Zap, TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CurrencyPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRate, setNewRate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { get, post } = useApi();
  const { toast } = useToast();

  const [converter, setConverter] = useState({ usd: "", ars: "" });

  const currentRate = rates.length > 0 ? Number(rates[0].usdToArs) : 0;

  const load = async () => {
    setLoading(true);
    const { data } = await get<unknown>("/api/currency");
    if (data) setRates((data as { data: ExchangeRate[] }).data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async () => {
    if (!newRate) return;
    setSaving(true);
    const { error } = await post("/api/currency", {
      usdToArs: parseFloat(newRate),
      note: note || undefined,
    });
    if (!error) {
      toast({ title: `Cotización actualizada a $${newRate}` });
      setNewRate("");
      setNote("");
      load();
    } else {
      alert(error);
    }
    setSaving(false);
  };

  const handleConverterChange = (field: "usd" | "ars", value: string) => {
    if (field === "usd") {
      setConverter({ usd: value, ars: value ? (parseFloat(value) * currentRate).toFixed(0) : "" });
    } else {
      setConverter({ ars: value, usd: value && currentRate ? (parseFloat(value) / currentRate).toFixed(2) : "" });
    }
  };

  const chartData = [...rates].reverse().map((r) => ({
    date: formatDate(r.createdAt),
    rate: Number(r.usdToArs),
  }));

  return (
    <AppLayout title="Dólar / Cotización">
      <div className="space-y-5 animate-fade-in">
        {/* Current Rate */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Cotización Actual</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? "..." : `$${currentRate.toLocaleString("es-AR")}`}
                  </p>
                  <p className="text-xs text-gray-400">ARS por USD</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Rate */}
          <Card className="sm:col-span-2">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Actualizar Cotización</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-gray-500">Nuevo valor (ARS por USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="Ej: 1050"
                      className="pl-7 text-lg font-semibold"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-gray-500">Nota (opcional)</label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dólar oficial, blue..." />
                </div>
                <Button onClick={handleUpdate} disabled={saving || !newRate} className="h-9">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Converter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Convertidor USD ↔ ARS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 max-w-md">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-500">Dólares (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                  <Input
                    type="number"
                    value={converter.usd}
                    onChange={(e) => handleConverterChange("usd", e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
              <span className="text-gray-400 mt-4">⇄</span>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-500">Pesos (ARS)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                  <Input
                    type="number"
                    value={converter.ars}
                    onChange={(e) => handleConverterChange("ars", e.target.value)}
                    placeholder="0"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Historial de Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`$${Number(v ?? 0).toLocaleString("es-AR")}`, "Cotización"]} />
                  <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} fill="url(#rateGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* History Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Historial de Cotizaciones</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">USD → ARS</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Actualizado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm text-gray-500">{formatDate(r.createdAt, "time")}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={i === 0 ? "text-blue-600" : ""}>
                      ${Number(r.usdToArs).toLocaleString("es-AR")}
                    </span>
                    {i === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2">Actual</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">{r.note || "—"}</TableCell>
                  <TableCell className="text-sm text-gray-400">{r.setBy || "Sistema"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
