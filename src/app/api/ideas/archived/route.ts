import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const ideas = await prisma.idea.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
  });

  return NextResponse.json(ideas);
}
