import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function asDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function asIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
