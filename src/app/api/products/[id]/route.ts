import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  costUsd: z.number().min(0).optional(),
  costArs: z.number().min(0).optional(),
  priceArs: z.number().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).optional(),
  images: z.array(z.string()).optional(),
  barcode: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      supplier: true,
      variants: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
      },
      variantAttributes: true,
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    let profitMargin: number | undefined;
    if (data.priceArs !== undefined && data.costArs !== undefined) {
      profitMargin = data.costArs > 0
        ? ((data.priceArs - data.costArs) / data.costArs) * 100
        : 0;
    }

    const product = await prisma.product.update({
      where: { id },
      data: { ...data, ...(profitMargin !== undefined ? { profitMargin } : {}) },
      include: { category: true, brand: true },
    });

    return NextResponse.json({ data: product });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;

  await prisma.product.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  return NextResponse.json({ message: "Producto desactivado" });
}
