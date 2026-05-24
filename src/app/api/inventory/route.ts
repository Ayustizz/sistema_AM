import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const movementSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN", "TRANSFER"]),
  quantity: z.number().int().min(1),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.createdAt = dateFilter;
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, sku: true, attributes: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return NextResponse.json({
    data: movements,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await req.json();
    const data = movementSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { stock: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    let newQty = product.stock;
    if (data.type === "IN" || data.type === "RETURN") {
      newQty += data.quantity;
    } else if (data.type === "OUT") {
      newQty = Math.max(0, newQty - data.quantity);
    } else if (data.type === "ADJUSTMENT") {
      newQty = data.quantity;
    }

    const movement = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: newQty },
      });

      if (data.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: data.variantId },
          select: { stock: true },
        });

        if (variant) {
          let variantNewQty = variant.stock;
          if (data.type === "IN" || data.type === "RETURN") {
            variantNewQty += data.quantity;
          } else if (data.type === "OUT") {
            variantNewQty = Math.max(0, variantNewQty - data.quantity);
          } else if (data.type === "ADJUSTMENT") {
            variantNewQty = data.quantity;
          }

          await tx.productVariant.update({
            where: { id: data.variantId },
            data: { stock: variantNewQty },
          });
        }
      }

      return tx.stockMovement.create({
        data: {
          productId: data.productId,
          variantId: data.variantId,
          type: data.type,
          quantity: data.quantity,
          previousQty: product.stock,
          newQty,
          reason: data.reason,
          reference: data.reference,
          userId: session!.id,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      });
    });

    return NextResponse.json({ data: movement }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al registrar movimiento" }, { status: 500 });
  }
}
