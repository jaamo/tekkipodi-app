import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const idea = await prisma.idea.update({
    where: { id },
    data: {
      viewCount: { increment: 1 },
      lastTouchedAt: new Date(),
    },
    include: {
      links: { orderBy: { createdAt: "asc" } },
      chatMessages: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(idea);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = { lastTouchedAt: new Date() };
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.notes === "string") data.notes = body.notes;

  const idea = await prisma.idea.update({
    where: { id },
    data,
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
  await prisma.idea.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
