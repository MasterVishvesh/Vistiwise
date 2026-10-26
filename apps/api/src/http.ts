import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createHash, randomBytes } from "node:crypto";
import type { ZodType } from "zod";
import { prisma } from "./db.js";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const COOKIE = "physio_session";
const MONTH = 60 * 60 * 24 * 30;

export async function readBody<T>(c: Context, schema: ZodType<T>): Promise<T> {
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Check the form.");
  }
  return parsed.data;
}

export async function currentDoctor(c: Context) {
  const token = getCookie(c, COOKIE);
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { doctor: true },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.doctor;
}

export async function requireDoctor(c: Context) {
  const doctor = await currentDoctor(c);
  if (!doctor) throw new HttpError(401, "Sign in to continue.");
  return doctor;
}

export async function startSession(c: Context, doctorId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      doctorId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + MONTH * 1000),
    },
  });
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MONTH,
  });
}

export async function endSession(c: Context) {
  const token = getCookie(c, COOKIE);
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  deleteCookie(c, COOKIE, { path: "/" });
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
