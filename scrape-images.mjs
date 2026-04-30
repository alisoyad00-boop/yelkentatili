import puppeteer from 'puppeteer-core';

const url = process.argv[2] || 'https://fethiyesailing.com/kiralik-tekneler/?_tekne-turu%7Cand=gulet';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1440, height: 900 },
});

try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  // scroll to trigger lazy load
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let total = 0;
      const dist = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, dist);
        total += dist;
        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
  await new Promise(r => setTimeout(r, 2500));

  const imgs = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('img'));
    return all.map(i => ({
      src: i.currentSrc || i.src || i.getAttribute('data-src') || i.getAttribute('data-lazy-src') || '',
      alt: (i.alt || '').slice(0, 80),
      w: i.naturalWidth, h: i.naturalHeight,
    })).filter(x => x.src && !x.src.startsWith('data:') && (x.w > 200 || /\.(jpg|jpeg|png|webp)/i.test(x.src)));
  });

  imgs.forEach(i => console.log(`${i.w}x${i.h}\t${i.alt}\t${i.src}`));
} finally { await browser.close(); }
