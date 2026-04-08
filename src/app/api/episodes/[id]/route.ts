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

  const episode = await prisma.episode.findUnique({
    where: { id },
    include: {
      ideas: {
        orderBy: { orderInEpisode: "asc" },
        include: {
          links: { where: { crawlStatus: "done" }, select: { id: true, url: true, title: true, summary: true } },
        },
      },
    },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  return NextResponse.json(episode);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const { title, episodeNumber } = await request.json();

  const data: { title?: string; episodeNumber?: number } = {};
  if (title !== undefined) data.title = title.trim();
  if (episodeNumber !== undefined) data.episodeNumber = episodeNumber;

  const episode = await prisma.episode.update({
    where: { id },
    data,
  });

  return NextResponse.json(episode);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  // Unassign all ideas from this episode
  await prisma.idea.updateMany({
    where: { episodeId: id },
    data: { episodeId: null, orderInEpisode: null },
  });

  await prisma.episode.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
