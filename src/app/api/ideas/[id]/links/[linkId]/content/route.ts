import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { summarizeManualContent } from "@/lib/crawl";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id, linkId } = await params;
  const { content } = await request.json();

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  await prisma.idea.update({
    where: { id },
    data: { lastTouchedAt: new Date() },
  });

  summarizeManualContent(linkId, content.trim()).catch(console.error);

  return NextResponse.json({ ok: true }, { status: 202 });
}
