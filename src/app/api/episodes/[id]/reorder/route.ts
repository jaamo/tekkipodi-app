import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const { ideaIds } = await request.json();

  if (!Array.isArray(ideaIds)) {
    return NextResponse.json({ error: "ideaIds must be an array" }, { status: 400 });
  }

  // Update each idea's order
  await Promise.all(
    ideaIds.map((ideaId: string, index: number) =>
      prisma.idea.update({
        where: { id: ideaId },
        data: { orderInEpisode: index, episodeId: id },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
