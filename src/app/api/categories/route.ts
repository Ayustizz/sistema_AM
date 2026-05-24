import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ data: categories });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const category = await prisma.category.create({ data });
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
