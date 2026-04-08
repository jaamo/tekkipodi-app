import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const { direction } = await request.json();

  if (direction !== "up" && direction !== "down") {
    return NextResponse.json({ error: "Direction must be 'up' or 'down'" }, { status: 400 });
  }

  const idea = await prisma.idea.update({
    where: { id },
    data: {
      voteScore: { increment: direction === "up" ? 1 : -1 },
      lastTouchedAt: new Date(),
    },
  });

  return NextResponse.json({ voteScore: idea.voteScore });
}
