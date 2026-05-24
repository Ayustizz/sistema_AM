"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color?: "blue" | "emerald" | "amber" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1">
            {trend >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {Math.abs(trend).toFixed(1)}% vs mes anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    const load = async () => {
      const { data } = await get<DashboardStats>("/api/dashboard");
      if (data) setStats(data);
      setLoading(false);
    };
    load();
  }, [get]);

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-24" />
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Ventas Hoy"
            value={formatCurrency(stats?.todayRevenue || 0)}
            subtitle={`${stats?.todaySales || 0} transacciones`}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Ganancia Hoy"
            value={formatCurrency(stats?.todayProfit || 0)}
            subtitle="Neta después de costos"
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            title="Ventas del Mes"
            value={formatCurrency(stats?.monthRevenue || 0)}
            subtitle={`${stats?.monthSales || 0} transacciones`}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Ganancia Mensual"
            value={formatCurrency(stats?.monthProfit || 0)}
            subtitle="Neta acumulada"
            icon={TrendingUp}
            color="amber"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Productos Activos</p>
                  <p className="text-2xl font-bold mt-1">{stats?.totalProducts || 0}</p>
                </div>
                <Package className="h-5 w-5 text-gray-400" />
              </div>
              {(stats?.lowStockCount || 0) > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">
                    {stats?.lowStockCount} con stock bajo
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Clientes</p>
                  <p className="text-2xl font-bold mt-1">{stats?.totalCustomers || 0}</p>
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500">Clientes activos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Dólar / Cotización</p>
                  <p className="text-2xl font-bold mt-1">
                    ${(stats?.exchangeRate || 0).toLocaleString("es-AR")}
                  </p>
                </div>
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-1 text-xs text-gray-500">ARS por USD</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Ventas y Ganancias — Últimos 7 días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.weekSalesData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), ""]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" name="Ventas" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" name="Ganancia" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Productos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.topProducts || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Últimas Ventas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {(stats?.recentSales || []).slice(0, 6).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                      {sale.customer?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {sale.customer?.name || "Cliente ocasional"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.saleNumber} · {formatDate(sale.saleDate, "time")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(sale.total))}</p>
                    <Badge variant="success" className="text-xs">Completada</Badge>
                  </div>
                </div>
              ))}
              {(!stats?.recentSales || stats.recentSales.length === 0) && (
                <div className="px-6 py-8 text-center text-sm text-gray-400">
                  No hay ventas recientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
