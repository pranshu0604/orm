import { chromium } from 'playwright';

export async function launchChromium() {
  if (process.env.VERCEL !== '1') return chromium.launch({ headless: true });

  const { default: serverChromium } = await import('@sparticuz/chromium');
  return chromium.launch({
    executablePath: await serverChromium.executablePath(),
    args: serverChromium.args,
    headless: true,
  });
}
