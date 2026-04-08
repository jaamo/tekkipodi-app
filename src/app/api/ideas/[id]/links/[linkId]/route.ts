import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { linkId } = await params;
  await prisma.link.delete({ where: { id: linkId } });

  return NextResponse.json({ ok: true });
}
