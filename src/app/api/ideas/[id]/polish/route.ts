import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  if (!idea.notes || !idea.notes.trim()) {
    return NextResponse.json({ error: "No notes to polish" }, { status: 400 });
  }

  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You polish raw notes into a clean bulleted list. Rules:
- Convert the notes into a markdown bulleted list (using "- ").
- Do NOT add new content or ideas. Only use what is already in the notes.
- Fix typos and grammar.
- End each bullet point with a period.
- Remove extra spaces.
- Keep the original language of the notes.
- Return ONLY the bulleted list, nothing else.`,
    messages: [{ role: "user", content: idea.notes }],
  });

  const polished =
    response.content[0].type === "text" ? response.content[0].text : "";

  await prisma.idea.update({
    where: { id },
    data: { notes: polished, lastTouchedAt: new Date() },
  });

  return NextResponse.json({ notes: polished });
}
