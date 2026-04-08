import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const messages = await prisma.chatMessage.findMany({
    where: { ideaId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const { message } = await request.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Save user message
  await prisma.chatMessage.create({
    data: { role: "user", content: message, ideaId: id },
  });

  // Load context
  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      links: { where: { crawlStatus: "done" } },
      chatMessages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  // Update lastTouchedAt
  await prisma.idea.update({
    where: { id },
    data: { lastTouchedAt: new Date() },
  });

  // Build context
  const linkContext = idea.links
    .map((l) => `- ${l.title || l.url}: ${l.summary || "No summary"}`)
    .join("\n");

  const systemPrompt = `You are a podcast research assistant helping analyze and ideate around topics for a tech podcast called "Tekkipodi".

Current idea: "${idea.title}"
${idea.notes ? `Notes: ${idea.notes}` : ""}
${linkContext ? `\nReference articles:\n${linkContext}` : ""}

Help the user think deeply about this topic. Ask probing questions, suggest interesting angles, play devil's advocate, and help them find the most compelling discussion points. Be conversational and concise. Reply in the same language as the user's message.`;

  const chatHistory = idea.chatMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const anthropic = new Anthropic();

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: chatHistory,
  });

  let fullResponse = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullResponse += event.delta.text;
            controller.enqueue(
              new TextEncoder().encode(event.delta.text)
            );
          }
        }

        // Save assistant message after stream completes
        await prisma.chatMessage.create({
          data: { role: "assistant", content: fullResponse, ideaId: id },
        });

        controller.close();
      } catch (error) {
        console.error("Chat stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
