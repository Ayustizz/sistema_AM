"use client";

import React from "react";
import { Bell, Search, Moon, Sun, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-6 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-500">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-gray-500">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 text-gray-700 dark:text-gray-300">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold dark:bg-blue-900 dark:text-blue-300">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden text-sm font-medium sm:inline-block">{user?.name || "Usuario"}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
