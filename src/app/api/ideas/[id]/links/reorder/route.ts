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
  const { linkIds } = await request.json();

  if (!Array.isArray(linkIds)) {
    return NextResponse.json({ error: "linkIds must be an array" }, { status: 400 });
  }

  await Promise.all(
    linkIds.map((linkId: string, index: number) =>
      prisma.link.update({
        where: { id: linkId },
        data: { position: index },
      })
    )
  );

  await prisma.idea.update({
    where: { id },
    data: { lastTouchedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
