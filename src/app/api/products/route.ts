import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  costUsd: z.number().min(0),
  costArs: z.number().min(0),
  priceArs: z.number().min(0),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(1),
  status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).default("ACTIVE"),
  images: z.array(z.string()).default([]),
  barcode: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");
  const lowStock = searchParams.get("lowStock") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (lowStock) {
    // Low stock filter applied post-query
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true } },
        brand: { select: { id: true, name: true } },
        variants: { where: { active: true }, select: { id: true, sku: true, attributes: true, stock: true, priceArs: true } },
        _count: { select: { variants: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await req.json();
    const data = productSchema.parse(body);

    // Generate SKU
    const count = await prisma.product.count();
    const prefix = data.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
    const sku = `${prefix}${String(count + 1).padStart(5, "0")}`;

    const profitMargin =
      data.costArs > 0
        ? ((data.priceArs - data.costArs) / data.costArs) * 100
        : 0;

    const product = await prisma.product.create({
      data: {
        ...data,
        sku,
        profitMargin,
      },
      include: {
        category: true,
        brand: true,
      },
    });

    // Log stock movement if initial stock > 0
    if (data.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: data.stock,
          previousQty: 0,
          newQty: data.stock,
          reason: "Stock inicial",
          userId: session!.id,
        },
      });
    }

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Create product error:", err);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
