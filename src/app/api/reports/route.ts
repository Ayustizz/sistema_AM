import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "sales";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  switch (type) {
    case "sales": {
      const sales = await prisma.sale.findMany({
        where: { ...(Object.keys(dateFilter).length ? { saleDate: dateFilter } : {}), status: "COMPLETED" },
        orderBy: { saleDate: "desc" },
        include: {
          customer: { select: { name: true } },
          user: { select: { name: true } },
          items: { include: { product: { select: { name: true } } } },
          payments: true,
        },
      });

      const totals = sales.reduce(
        (acc, sale) => ({
          revenue: acc.revenue + Number(sale.total),
          profit: acc.profit + Number(sale.profit),
          cost: acc.cost + Number(sale.totalCost),
          count: acc.count + 1,
        }),
        { revenue: 0, profit: 0, cost: 0, count: 0 }
      );

      return NextResponse.json({ data: sales, totals });
    }

    case "expenses": {
      const expenses = await prisma.expense.findMany({
        where: Object.keys(dateFilter).length ? { date: dateFilter } : {},
        orderBy: { date: "desc" },
        include: { user: { select: { name: true } } },
      });

      const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      const byCategory = expenses.reduce(
        (acc, e) => {
          const cat = e.category;
          acc[cat] = (acc[cat] || 0) + Number(e.amount);
          return acc;
        },
        {} as Record<string, number>
      );

      return NextResponse.json({ data: expenses, total, byCategory });
    }

    case "products": {
      const topProducts = await prisma.saleItem.groupBy({
        by: ["productId"],
        where: Object.keys(dateFilter).length
          ? { sale: { saleDate: dateFilter, status: "COMPLETED" } }
          : { sale: { status: "COMPLETED" } },
        _sum: { quantity: true, total: true },
        _count: true,
        orderBy: { _sum: { total: "desc" } },
        take: 20,
      });

      const productIds = topProducts.map((p) => p.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true, category: { select: { name: true } } },
      });

      const enriched = topProducts.map((p) => {
        const product = products.find((d) => d.id === p.productId);
        return {
          product,
          quantity: Number(p._sum.quantity || 0),
          revenue: Number(p._sum.total || 0),
          orders: p._count,
        };
      });

      return NextResponse.json({ data: enriched });
    }

    case "stock": {
      const products = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { stock: "asc" },
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
      });

      const lowStock = products.filter((p) => p.stock <= p.minStock);
      const outOfStock = products.filter((p) => p.stock === 0);

      return NextResponse.json({
        data: products,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        total: products.length,
      });
    }

    default:
      return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });
  }
}
