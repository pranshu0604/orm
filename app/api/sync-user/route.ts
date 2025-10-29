// app/api/sync-user/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
      throw new Error("Missing CLERK_WEBHOOK_SECRET");
    }

    // Get headers for verification
    const svix_id = req.headers.get("svix-id");
    const svix_timestamp = req.headers.get("svix-timestamp");
    const svix_signature = req.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 401 });
    }

    // Get the raw body as text (required for signature verification)
    const body = await req.text();

    // Debug: log first 100 chars of body and secret prefix
    console.log("[webhook] Body preview:", body.substring(0, 100));
    console.log("[webhook] Secret prefix:", webhookSecret.substring(0, 10));
    console.log("[webhook] Headers:", { svix_id, svix_timestamp, sig_prefix: svix_signature?.substring(0, 20) });

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Handle the event
    const eventType = evt.type;
    
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const email = email_addresses?.[0]?.email_address || "";
      const name = [first_name, last_name].filter(Boolean).join(" ");
      const image = image_url || "";

      await prisma.user.upsert({
        where: { clerkId: id },
        update: { email, name, image },
        create: { clerkId: id, email, name, image },
      });

      console.log(`User ${eventType}:`, { id, email, name });
    } else if (eventType === "user.deleted") {
      const { id } = evt.data;

      // Safely delete user and related data. We delete dependent rows in order to
      // avoid foreign key constraint errors: metrics/sentiments -> posts -> platformConnections -> reports -> user
      const user = await prisma.user.findUnique({ where: { clerkId: id }, select: { id: true } });
      if (user) {
        // Delete posts' metrics and sentiments for each platform connection
        const conns = await prisma.platformConnection.findMany({ where: { userId: user.id }, select: { id: true } });
        for (const conn of conns) {
          const posts = await prisma.post.findMany({ where: { platformConnId: conn.id }, select: { id: true } });
          const postIds = posts.map(p => p.id);
          if (postIds.length) {
            await prisma.metric.deleteMany({ where: { postId: { in: postIds } } });
            await prisma.sentiment.deleteMany({ where: { postId: { in: postIds } } });
            await prisma.post.deleteMany({ where: { id: { in: postIds } } });
          }

          await prisma.platformConnection.deleteMany({ where: { id: conn.id } });
        }

        // Delete performance reports
        await prisma.performanceReport.deleteMany({ where: { userId: user.id } });

        // Finally delete the user
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`User deleted: ${id}`);
      } else {
        console.log(`User to delete not found locally: ${id}`);
      }
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}