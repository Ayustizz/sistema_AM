import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { sign, verify } from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: { userId: string; role: string }) {
  return sign(payload, JWT_SECRET, { expiresIn: SESSION_DURATION });
}

export function verifyToken(token: string) {
  try {
    return verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function getSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("auth-token")?.value;
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      active: true,
    },
  });

  if (!user || !user.active) return null;
  return user;
}

export async function requireAuth(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return { session: null, error: "Unauthorized" };
  }
  return { session, error: null };
}

export async function requireAdmin(req: NextRequest) {
  const { session, error } = await requireAuth(req);
  if (error || !session) return { session: null, error: error || "Unauthorized" };
  if (session.role !== "ADMIN") return { session: null, error: "Forbidden" };
  return { session, error: null };
}
