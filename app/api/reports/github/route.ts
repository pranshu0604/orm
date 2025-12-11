import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai-client';

/**
 * POST /api/reports/github
 * Generate a GitHub performance report
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { platformConnectionId } = body;

    if (!platformConnectionId) {
      return NextResponse.json(
        { error: 'Platform connection ID is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        usageHistory: {
          where: {
            usageType: 'PERFORMANCE_REPORT',
            successful: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check credits
    if (user.tier === 'FREE') {
      const freeReportsUsed = user.usageHistory.length;
      const FREE_TIER_LIMIT = 10;

      if (freeReportsUsed >= FREE_TIER_LIMIT && user.creditsRemaining <= 0) {
        return NextResponse.json(
          { error: 'Credit limit reached. Please upgrade or purchase more credits.' },
          { status: 403 }
        );
      }
    } else if (user.creditsRemaining <= 0) {
      return NextResponse.json(
        { error: 'No credits remaining. Please purchase more credits.' },
        { status: 403 }
      );
    }

    // Get platform connection
    const platformConnection = await prisma.platformConnection.findUnique({
      where: { id: platformConnectionId },
    });

    if (!platformConnection || platformConnection.userId !== user.id) {
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    if (platformConnection.platform !== 'GITHUB') {
      return NextResponse.json(
        { error: 'Invalid platform. Expected GitHub.' },
        { status: 400 }
      );
    }

    // Fetch GitHub data using GitHub API
    const githubUsername = platformConnection.username;
    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub username not found' },
        { status: 400 }
      );
    }

    // Fetch user data from GitHub API
    const userResponse = await fetch(`https://api.github.com/users/${githubUsername}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add GitHub token if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        }),
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user data');
    }

    const githubUser = await userResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          }),
        },
      }
    );

    if (!reposResponse.ok) {
      throw new Error('Failed to fetch GitHub repositories');
    }

    const githubRepos = await reposResponse.json();

    // Fetch recent activity/events for commit count (approximation)
    const eventsResponse = await fetch(
      `https://api.github.com/users/${githubUsername}/events?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          }),
        },
      }
    );

    const githubEvents = eventsResponse.ok ? await eventsResponse.json() : [];

    // Count events by type
    const pushEvents = githubEvents.filter((e: { type: string }) => e.type === 'PushEvent');
    const prEvents = githubEvents.filter((e: { type: string }) => e.type === 'PullRequestEvent');
    const issueEvents = githubEvents.filter((e: { type: string }) => e.type === 'IssuesEvent' || e.type === 'IssueCommentEvent');

    // Get previous reports for context
    const previousReports = await prisma.performanceReport.findMany({
      where: {
        userId: user.id,
        platformConnectionId,
        includedInContext: true,
      },
      orderBy: { generatedAt: 'desc' },
      take: 3,
      select: { content: true },
    });

    // Prepare data for AI service
    const userData = {
      username: githubUsername,
      bio: githubUser.bio || platformConnection.platformAspiration || user.aspiration || '',
      followers: githubUser.followers || 0,
      following: githubUser.following || 0,
      public_repos: githubUser.public_repos || 0,
      total_commits: pushEvents.length * 2, // Rough estimate from recent events
      total_prs: prEvents.length,
      total_issues: issueEvents.length,
    };

    const reposData = githubRepos.slice(0, 20).map((repo: {
      name: string;
      description: string;
      stargazers_count: number;
      language: string
    }) => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count || 0,
      language: repo.language,
    }));

    // Call AI service
    let report;
    let errorMessage: string | undefined;

    try {
      report = await aiClient.generateGitHubReport({
        userData,
        reposData,
        targetTier: platformConnection.targetTier,
        previousReports: previousReports.map(r => r.content),
      });
    } catch (error) {
      console.error('AI Service Error:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed usage
      await prisma.usageHistory.create({
        data: {
          userId: user.id,
          usageType: 'PERFORMANCE_REPORT',
          creditsUsed: 0,
          successful: false,
          platformType: 'GITHUB',
          errorMessage,
        },
      });

      throw error;
    }

    // Save report to database
    const savedReport = await prisma.performanceReport.create({
      data: {
        userId: user.id,
        platformConnectionId,
        content: JSON.stringify(report),
        score: report.overall_score,
        metrics: report.metrics as never,
        includedInContext: true,
      },
    });

    // Log successful usage
    const creditsUsed = user.tier === 'PAID' ? 1 : 0;
    await prisma.usageHistory.create({
      data: {
        userId: user.id,
        usageType: 'PERFORMANCE_REPORT',
        creditsUsed,
        successful: true,
        platformType: 'GITHUB',
      },
    });

    // Deduct credits if paid user
    if (user.tier === 'PAID' && creditsUsed > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          creditsRemaining: {
            decrement: creditsUsed,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: savedReport.id,
        ...report,
        generatedAt: savedReport.generatedAt,
      },
    });

  } catch (error) {
    console.error('Error generating GitHub report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/github?platformConnectionId=xxx
 * Get GitHub performance reports for a platform connection
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const platformConnectionId = searchParams.get('platformConnectionId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!platformConnectionId) {
      return NextResponse.json(
        { error: 'Platform connection ID is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get reports
    const reports = await prisma.performanceReport.findMany({
      where: {
        userId: user.id,
        platformConnectionId,
      },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        id: report.id,
        content: JSON.parse(report.content),
        score: report.score,
        generatedAt: report.generatedAt,
      })),
    });

  } catch (error) {
    console.error('Error fetching GitHub reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
