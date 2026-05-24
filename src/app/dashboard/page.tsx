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
  color = "blue",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
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
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-gray-900 truncate">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={`flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl ml-3 ${colors[color]}`}>
            <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
          </div>
        </div>
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-20 lg:h-24" />
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-4 lg:space-y-6 animate-fade-in">

        {/* KPI Cards — 2 cols mobile, 4 desktop */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
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
            subtitle="Neta"
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

        {/* Secondary KPIs — 1 col mobile, 3 desktop */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Productos</p>
                  <p className="text-xl font-bold mt-1">{stats?.totalProducts || 0}</p>
                </div>
                <Package className="h-5 w-5 text-gray-300" />
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
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Clientes</p>
                  <p className="text-xl font-bold mt-1">{stats?.totalCustomers || 0}</p>
                </div>
                <Users className="h-5 w-5 text-gray-300" />
              </div>
              <p className="mt-1 text-xs text-gray-500">Activos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Dólar</p>
                  <p className="text-xl font-bold mt-1">
                    ${(stats?.exchangeRate || 0).toLocaleString("es-AR")}
                  </p>
                </div>
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500">ARS por USD</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row — stacked on mobile, side by side on desktop */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Revenue Chart — full width mobile, 2/3 desktop */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 px-4 lg:px-6">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Ventas y Ganancias — Últimos 7 días
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 lg:px-6">
              <ResponsiveContainer width="100%" height={180}>
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
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={40} />
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
            <CardHeader className="pb-2 px-4 lg:px-6">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 lg:px-6">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats?.topProducts || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }} />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card>
          <CardHeader className="pb-3 px-4 lg:px-6">
            <CardTitle className="text-sm font-semibold text-gray-700">Últimas Ventas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {(stats?.recentSales || []).slice(0, 6).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-4 lg:px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                      {sale.customer?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sale.customer?.name || "Ocasional"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {sale.saleNumber} · {formatDate(sale.saleDate, "time")}
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(sale.total))}</p>
                    <Badge variant="success" className="text-xs">OK</Badge>
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
