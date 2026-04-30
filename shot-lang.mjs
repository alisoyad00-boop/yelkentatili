import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const url = process.argv[2] || 'http://localhost:3000/';
const lang = process.argv[3] || 'tr';
const label = process.argv[4] || lang;
const isMobile = process.argv[5] === 'mobile';

const dir = 'temporary screenshots';
if (!existsSync(dir)) await mkdir(dir, { recursive: true });
const existing = await readdir(dir);
const nums = existing.map(f => Number((f.match(/screenshot-(\d+)/) || [])[1])).filter(Number.isFinite);
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const fname = `screenshot-${next}-${label}.png`;

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  defaultViewport: isMobile
    ? { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { width: 1440, height: 900, deviceScaleFactor: 1 },
});
try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((l) => { try { localStorage.setItem('lang', l); } catch(e){} }, lang);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('in')));
  await new Promise(r => setTimeout(r, 1500));
  const out = join(dir, fname);
  await page.screenshot({ path: out, fullPage: false, type: 'png' });
  console.log(out);
} finally { await browser.close(); }
