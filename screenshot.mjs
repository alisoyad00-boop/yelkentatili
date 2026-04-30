import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const url      = process.argv[2] || 'http://localhost:3000/';
const label    = process.argv[3] || '';
const width    = Number(process.argv[4]) || 1440;
const height   = Number(process.argv[5]) || 900;
const fullPage = (process.argv[6] || 'full') === 'full';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const dir = 'temporary screenshots';
if (!existsSync(dir)) await mkdir(dir, { recursive: true });

const existing = await readdir(dir);
const nums = existing.map(f => Number((f.match(/screenshot-(\d+)/) || [])[1])).filter(Number.isFinite);
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const fname = `screenshot-${next}${label ? '-' + label : ''}.png`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  defaultViewport: { width, height, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  // wait for fonts + images
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // Force all reveal elements visible (full-page snapshots don't trigger IO past viewport)
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  });
  await new Promise(r => setTimeout(r, 1500));
  const out = join(dir, fname);
  await page.screenshot({ path: out, fullPage, type: 'png' });
  console.log(out);
} finally {
  await browser.close();
}
