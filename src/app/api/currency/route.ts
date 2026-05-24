import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  usdToArs: z.number().min(1),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const rates = await prisma.exchangeRate.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ data: rates });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const rate = await prisma.exchangeRate.create({
      data: {
        usdToArs: data.usdToArs,
        note: data.note,
        setBy: session!.name,
      },
    });

    return NextResponse.json({ data: rate }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar cotización" }, { status: 500 });
  }
}
