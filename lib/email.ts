import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendDigestEmail(params: {
  to: string;
  username: string | null;
  platformLabel: string;
  notablePosts: { content: string; likes: number; multiplier: number; postedAt: Date }[];
}): Promise<void> {
  const { to, username, platformLabel, notablePosts } = params;

  const rows = notablePosts
    .map(
      (p) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1e293b;">
        <div style="font-family:monospace;color:#22d3ee;font-size:11px;">[${p.multiplier}x baseline]</div>
        <div style="color:#e5e7eb;font-size:14px;margin-top:4px;">${escapeHtml(p.content).slice(0, 200)}</div>
        <div style="color:#6b7280;font-size:11px;margin-top:4px;">${p.likes.toLocaleString()} likes &middot; ${new Date(p.postedAt).toLocaleDateString()}</div>
      </td>
    </tr>`
    )
    .join('');

  const html = `
  <div style="background:#030712;padding:32px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
    <div style="max-width:480px;margin:0 auto;">
      <div style="font-family:monospace;color:#22d3ee;font-size:12px;letter-spacing:2px;text-transform:uppercase;">P.R.A.N. // Digest</div>
      <h1 style="color:#fff;font-size:22px;margin:12px 0 4px;">${escapeHtml(platformLabel)} activity update</h1>
      <p style="color:#9ca3af;font-size:14px;">Hey${username ? ` ${escapeHtml(username)}` : ''}, here's what's been outperforming your usual on ${escapeHtml(platformLabel)}:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">${rows}</table>
      <p style="color:#4b5563;font-size:11px;margin-top:24px;font-family:monospace;">Sent by P.R.A.N. — your reputation, automated.</p>
    </div>
  </div>`;

  await resend.emails.send({
    from: 'PRAN <onboarding@resend.dev>',
    to,
    subject: `${platformLabel}: ${notablePosts.length} post${notablePosts.length > 1 ? 's' : ''} outperforming your baseline`,
    html,
  });
}
