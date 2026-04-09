import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const idea = await prisma.idea.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  return NextResponse.json(idea);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const idea = await prisma.idea.update({
    where: { id },
    data: { archivedAt: null },
  });

  return NextResponse.json(idea);
}
