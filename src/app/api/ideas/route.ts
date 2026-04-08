import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const TWO_MONTHS_MS = 1000 * 60 * 60 * 24 * 60;

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const ideas = await prisma.idea.findMany({
    where: { episodeId: null },
    include: { links: { select: { id: true, url: true, title: true, crawlStatus: true } } },
    orderBy: [{ voteScore: "desc" }, { createdAt: "desc" }],
  });

  const now = Date.now();
  const result = ideas.map((idea) => ({
    ...idea,
    isFaded: now - idea.lastTouchedAt.getTime() > TWO_MONTHS_MS,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { title } = await request.json();
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const idea = await prisma.idea.create({
    data: { title: title.trim() },
  });

  return NextResponse.json(idea, { status: 201 });
}
