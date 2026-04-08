import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const episodes = await prisma.episode.findMany({
    include: { ideas: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  const result = episodes.map((ep) => ({
    ...ep,
    ideaCount: ep.ideas.length,
    ideas: undefined,
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

  const episode = await prisma.episode.create({
    data: { title: title.trim() },
  });

  return NextResponse.json(episode, { status: 201 });
}
