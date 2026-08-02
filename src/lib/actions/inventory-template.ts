"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageInventoryTemplates } from "@/lib/agency/permissions";

export async function createInventoryTemplate(data: {
  title: string;
  project: string;
  messageBody: string;
  mediaUrl?: string | null;
}) {
  const session = await getServerSession(authOptions);
  if (!canManageInventoryTemplates(session?.user?.role) || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const title = data.title.trim();
  const project = data.project.trim();
  const messageBody = data.messageBody.trim();
  const mediaUrl = data.mediaUrl?.trim() || null;

  if (!title || !project || !messageBody) {
    throw new Error("Title, project, and message are required");
  }

  await prisma.inventoryTemplate.create({
    data: {
      title,
      project,
      messageBody,
      mediaUrl,
      createdById: session.user.id,
    },
  });

  revalidatePath("/inventory");
}
