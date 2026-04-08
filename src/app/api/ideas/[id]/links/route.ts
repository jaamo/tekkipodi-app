import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { crawlAndSummarize } from "@/lib/crawl";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const link = await prisma.link.create({
    data: { url: url.trim(), ideaId: id },
  });

  // Update lastTouchedAt
  await prisma.idea.update({
    where: { id },
    data: { lastTouchedAt: new Date() },
  });

  // Fire-and-forget crawl + summarize
  crawlAndSummarize(link.id, url.trim()).catch(console.error);

  return NextResponse.json(link, { status: 201 });
}
