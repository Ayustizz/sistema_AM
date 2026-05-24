import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: "ARS" | "USD" = "ARS") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "-";

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: string | Date, format: "short" | "long" | "time" = "short") {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  if (format === "time") {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }

  if (format === "long") {
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function generateSKU(name: string, counter: number): string {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase();
  return `${prefix}${String(counter).padStart(5, "0")}`;
}

export function generateSaleNumber(counter: number): string {
  return `VTA-${String(counter).padStart(6, "0")}`;
}

export function calculateProfit(priceArs: number, costArs: number): number {
  return priceArs - costArs;
}

export function calculateMargin(priceArs: number, costArs: number): number {
  if (costArs === 0) return 0;
  return ((priceArs - costArs) / costArs) * 100;
}

export function convertUsdToArs(usd: number, exchangeRate: number): number {
  return usd * exchangeRate;
}

export function calculateInstallment(
  total: number,
  installments: number,
  interestRate: number
): { monthly: number; totalWithInterest: number; totalInterest: number } {
  const totalWithInterest = total * (1 + interestRate / 100);
  const monthly = totalWithInterest / installments;
  return {
    monthly: Math.ceil(monthly),
    totalWithInterest: Math.ceil(totalWithInterest),
    totalInterest: Math.ceil(totalWithInterest - total),
  };
}

export function getDateRange(period: "today" | "week" | "month" | "year") {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end: now };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}
