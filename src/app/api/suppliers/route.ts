import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  contact: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = { active: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { contact: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, purchases: true } } },
  });

  return NextResponse.json({ data: suppliers });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const supplier = await prisma.supplier.create({ data });
    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear proveedor" }, { status: 500 });
  }
}
