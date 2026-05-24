import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saleItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  description: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  unitCost: z.number().min(0),
  discount: z.number().min(0).default(0),
});

const paymentSchema = z.object({
  method: z.enum(["CASH", "TRANSFER", "CARD_DEBIT", "CARD_CREDIT", "MERCADO_PAGO", "INSTALLMENTS"]),
  amount: z.number().min(0),
  reference: z.string().optional().nullable(),
  installments: z.number().int().optional().nullable(),
  interest: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const installmentPlanSchema = z.object({
  installments: z.number().int().min(2),
  interestRate: z.number().min(0),
  installmentAmt: z.number().min(0),
  totalWithInt: z.number().min(0),
});

const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  discount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1),
  payments: z.array(paymentSchema).min(1),
  installmentPlan: installmentPlanSchema.optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { saleNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.saleDate = dateFilter;
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { saleDate: "desc" },
      skip,
      take: limit,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        payments: true,
        installmentPlan: true,
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return NextResponse.json({
    data: sales,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await req.json();
    const data = saleSchema.parse(body);

    const subtotal = data.items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity - item.discount;
      return sum + itemTotal;
    }, 0);

    const total = subtotal - data.discount;
    const totalCost = data.items.reduce(
      (sum, item) => sum + item.unitCost * item.quantity,
      0
    );
    const profit = total - totalCost;

    // Generate sale number
    const count = await prisma.sale.count();
    const saleNumber = `VTA-${String(count + 1).padStart(6, "0")}`;

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: data.customerId,
          userId: session!.id,
          subtotal,
          discount: data.discount,
          total,
          totalCost,
          profit,
          notes: data.notes,
          status: "COMPLETED",
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              discount: item.discount,
              total: item.unitPrice * item.quantity - item.discount,
            })),
          },
          payments: {
            create: data.payments,
          },
        },
        include: {
          items: true,
          payments: true,
          customer: true,
        },
      });

      // Update product stock and log movements
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (product) {
          const newStock = product.stock - item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: Math.max(0, newStock) },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              type: "OUT",
              quantity: item.quantity,
              previousQty: product.stock,
              newQty: Math.max(0, newStock),
              reference: saleNumber,
              reason: "Venta",
              userId: session!.id,
            },
          });
        }

        // Update variant stock if applicable
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stock: true },
          });

          if (variant) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: Math.max(0, variant.stock - item.quantity) },
            });
          }
        }
      }

      // Update customer totals
      if (data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { totalSpent: { increment: total } },
        });
      }

      // Create installment plan if applicable
      if (data.installmentPlan) {
        const plan = await tx.installmentPlan.create({
          data: {
            saleId: newSale.id,
            installments: data.installmentPlan.installments,
            interestRate: data.installmentPlan.interestRate,
            installmentAmt: data.installmentPlan.installmentAmt,
            totalWithInt: data.installmentPlan.totalWithInt,
          },
        });

        // Create individual installment rows
        const installmentRows = [];
        for (let i = 1; i <= data.installmentPlan.installments; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          installmentRows.push({
            planId: plan.id,
            number: i,
            amount: data.installmentPlan.installmentAmt,
            dueDate,
          });
        }

        await tx.installment.createMany({ data: installmentRows });
      }

      return newSale;
    });

    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Create sale error:", err);
    return NextResponse.json({ error: "Error al crear venta" }, { status: 500 });
  }
}
