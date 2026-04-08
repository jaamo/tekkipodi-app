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

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      chatMessages: { orderBy: { createdAt: "asc" } },
      links: { where: { crawlStatus: "done" } },
    },
  });

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const chatSummary = idea.chatMessages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");

  const anthropic = new Anthropic();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Based on this research discussion about "${idea.title}", generate a list of concrete podcast-worthy talking points. Each topic should be something specific the host can discuss on air.

Discussion:
${chatSummary.slice(0, 6000)}

${idea.notes ? `Existing notes: ${idea.notes}` : ""}

Return ONLY a JSON array of objects with "topic" (short title) and "description" (1-2 sentence expansion). Example:
[{"topic": "...", "description": "..."}]

Reply in the same language that was used in the discussion.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";

  // Extract JSON from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const topics = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  return NextResponse.json(topics);
}
