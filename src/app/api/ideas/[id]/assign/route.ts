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
  const { episodeId } = await request.json();

  // Get the max order in the episode
  const maxOrder = await prisma.idea.aggregate({
    where: { episodeId },
    _max: { orderInEpisode: true },
  });

  const idea = await prisma.idea.update({
    where: { id },
    data: {
      episodeId,
      orderInEpisode: (maxOrder._max.orderInEpisode ?? -1) + 1,
      lastTouchedAt: new Date(),
    },
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
    data: {
      episodeId: null,
      orderInEpisode: null,
      lastTouchedAt: new Date(),
    },
  });

  return NextResponse.json(idea);
}
