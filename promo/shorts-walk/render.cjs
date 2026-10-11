// Renders scene.html frame by frame (Chromium via Playwright) into PNGs.
//   node render.cjs <outDir> [--workers 4] [--fps 30] [--only 1.5,4.6,7.1]
// With --only it writes just those timestamps (as t_<sec>.png) for quick looks.
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_PKG || 'playwright');

const root = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(args[0] || 'frames');
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const WORKERS = +opt('workers', 4), FPS = +opt('fps', 30), ONLY = opt('only', null);

function logoModule(dir) {
  const b64 = f => fs.readFileSync(path.join(root, 'assets', f)).toString('base64');
  const js = `window.LOGO_JPG_SRC='data:image/jpeg;base64,${b64('logo.jpg')}';window.LOGO_PNG_SRC='data:image/png;base64,${b64('logo.png')}';`;
  fs.writeFileSync(path.join(dir, 'logo.js'), js);
  fs.copyFileSync(path.join(__dirname, 'scene.html'), path.join(dir, 'scene.html'));
}

async function shoot(page, t, file) {
  await page.evaluate(tt => window.renderFrame(tt), t);
  const b64 = await page.evaluate(() => document.getElementById('c').toDataURL('image/png').split(',')[1]);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const work = path.join(outDir, '_page'); fs.mkdirSync(work, { recursive: true });
  logoModule(work);
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-gpu'] });
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
    page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
    await page.goto('file://' + path.join(work, 'scene.html'));
    await page.evaluate(() => window.ready);
    return page;
  };

  if (ONLY) {
    const page = await open();
    for (const s of ONLY.split(',')) await shoot(page, +s, path.join(outDir, `t_${(+s).toFixed(2)}.png`));
    await browser.close(); return;
  }

  const probe = await open();
  const dur = await probe.evaluate(() => window.DURATION);
  await probe.close();
  const total = Math.round(dur * FPS);
  console.log(`rendering ${total} frames @ ${FPS}fps with ${WORKERS} workers`);
  let done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const page = await open();
    for (let i = w; i < total; i += WORKERS) {
      await shoot(page, i / FPS, path.join(outDir, `f_${String(i).padStart(5, '0')}.png`));
      if (++done % 60 === 0) console.log(`${done}/${total}`);
    }
    await page.close();
  }));
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
