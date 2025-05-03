// app/api/sync-user/route.ts

import { clerkClient } from "@clerk/clerk-sdk-node";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    const email: string = clerkUser.emailAddresses[0]?.emailAddress || "";
    const name: string = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");
    const image: string = clerkUser.imageUrl;

    const existingUser = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (
      !existingUser ||
      existingUser.email !== email ||
      existingUser.name !== name ||
      existingUser.image !== image
    ) {
      await prisma.user.upsert({
        where: { clerkId: userId },
        update: { email, name, image },
        create: { clerkId: userId, email, name, image },
      });
    }

    console.log("User synced", { userId, email, name, image });
    return NextResponse.json({ message: "User synced" });
  } catch (err) {
    console.error("Error syncing user:", err);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}