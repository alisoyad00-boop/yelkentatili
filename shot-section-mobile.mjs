import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
const url = process.argv[2], sel = process.argv[3], label = process.argv[4];
const dir = 'temporary screenshots';
if (!existsSync(dir)) await mkdir(dir, { recursive: true });
const existing = await readdir(dir);
const nums = existing.map(f => Number((f.match(/screenshot-(\d+)/) || [])[1])).filter(Number.isFinite);
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const fname = `screenshot-${next}-${label}.png`;
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
});
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('in')));
  await new Promise(r => setTimeout(r, 800));
  const el = await page.$(sel);
  if (!el) throw new Error('not found: ' + sel);
  const out = join(dir, fname);
  await el.screenshot({ path: out, type: 'png' });
  console.log(out);
} finally { await browser.close(); }
