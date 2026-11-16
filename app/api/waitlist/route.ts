import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_WAITLIST_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Waitlist unavailable' }, { status: 404 });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (typeof email !== 'string' || !email.trim() || email.length > 254) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingEntry = await prisma.waitlist.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Email is already on the waitlist' },
        { status: 409 }
      );
    }

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email: normalizedEmail,
      },
    });

    return NextResponse.json(
      {
        message: 'Successfully joined the waitlist',
        data: {
          id: waitlistEntry.id,
          email: waitlistEntry.email,
          createdAt: waitlistEntry.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
