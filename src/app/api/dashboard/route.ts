import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      todaySales,
      monthSales,
      totalProducts,
      totalCustomers,
      exchangeRate,
      recentSales,
      topProductsRaw,
      allProducts,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { saleDate: { gte: todayStart }, status: "COMPLETED" },
        _count: true,
        _sum: { total: true, profit: true },
      }),
      prisma.sale.aggregate({
        where: { saleDate: { gte: monthStart }, status: "COMPLETED" },
        _count: true,
        _sum: { total: true, profit: true },
      }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.customer.count({ where: { active: true } }),
      prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.sale.findMany({
        where: { status: "COMPLETED" },
        orderBy: { saleDate: "desc" },
        take: 8,
        include: {
          customer: { select: { name: true } },
          user: { select: { name: true } },
          items: { take: 1, include: { product: { select: { name: true } } } },
        },
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: { sale: { saleDate: { gte: monthStart }, status: "COMPLETED" } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { stock: true, minStock: true },
      }),
    ]);

    // Calculate low stock
    const lowStockCount = allProducts.filter((p) => p.stock <= p.minStock).length;

    // Get week sales data by day
    const weekSales = await prisma.sale.findMany({
      where: { saleDate: { gte: weekStart }, status: "COMPLETED" },
      select: { saleDate: true, total: true, profit: true },
      orderBy: { saleDate: "asc" },
    });

    // Group by date
    const weekSalesMap = new Map<string, { sales: number; revenue: number; profit: number }>();
    weekSales.forEach((s) => {
      const dateKey = new Date(s.saleDate).toLocaleDateString("es-AR", { weekday: "short", day: "numeric" });
      const existing = weekSalesMap.get(dateKey) || { sales: 0, revenue: 0, profit: 0 };
      weekSalesMap.set(dateKey, {
        sales: existing.sales + 1,
        revenue: existing.revenue + Number(s.total),
        profit: existing.profit + Number(s.profit),
      });
    });

    const weekSalesData = Array.from(weekSalesMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Fetch product names for top products
    const topProductIds = topProductsRaw.map((p) => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    });

    const topProducts = topProductsRaw.map((p) => {
      const product = topProductDetails.find((d) => d.id === p.productId);
      return {
        name: product?.name || "Desconocido",
        quantity: Number(p._sum.quantity || 0),
        revenue: Number(p._sum.total || 0),
      };
    });

    return NextResponse.json({
      data: {
        todaySales: Number(todaySales._count),
        todayRevenue: Number(todaySales._sum.total || 0),
        todayProfit: Number(todaySales._sum.profit || 0),
        monthSales: Number(monthSales._count),
        monthRevenue: Number(monthSales._sum.total || 0),
        monthProfit: Number(monthSales._sum.profit || 0),
        totalProducts,
        lowStockCount,
        totalCustomers,
        exchangeRate: Number(exchangeRate?.usdToArs || 1000),
        weekSalesData,
        topProducts,
        recentSales,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Error al cargar el dashboard" }, { status: 500 });
  }
}
