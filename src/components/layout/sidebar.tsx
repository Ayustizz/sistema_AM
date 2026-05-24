"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  DollarSign,
  Boxes,
  Settings,
  ChevronLeft,
  Zap,
  CreditCard,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/installments", label: "Cuotas", icon: CreditCard },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/suppliers", label: "Proveedores", icon: Truck },
  { href: "/finances", label: "Finanzas", icon: DollarSign },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/currency", label: "Dólar / Cambio", icon: Zap },
  { href: "/settings", label: "Configuración", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavContent({
  collapsed,
  onItemClick,
}: {
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      <ul className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-blue-600" : ""
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sidebar({
  collapsed = false,
  onCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">BizAdmin</span>
          </div>
          <button
            onClick={onMobileClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <NavContent collapsed={false} onItemClick={onMobileClose} />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-gray-100 bg-white transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-gray-100 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <span className="truncate text-base font-semibold text-gray-900">
                BizAdmin
              </span>
            )}
          </div>
        </div>

        <NavContent collapsed={collapsed} />

        {/* Collapse toggle */}
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={() => onCollapse?.(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
