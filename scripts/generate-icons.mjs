import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve(process.cwd());
const srcSvg = path.join(root, 'src', 'asset', 'favicon.svg');
const outDir = path.join(root, 'public', 'icons');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function generate() {
  await ensureDir(outDir);
  if (!fs.existsSync(srcSvg)) {
    console.warn('favicon.svg not found. Skipping icon generation.');
    return;
  }
  const tasks = [
    { file: 'icon-192.png', size: 192 },
    { file: 'icon-512.png', size: 512 },
    { file: 'maskable-icon-192.png', size: 192, padding: true },
    { file: 'maskable-icon-512.png', size: 512, padding: true },
    { file: 'apple-touch-icon-180.png', size: 180 },
  ];

  for (const t of tasks) {
    const out = path.join(outDir, t.file);
    const svgBuffer = await fs.promises.readFile(srcSvg);
    let image = sharp(svgBuffer).resize(t.size, t.size, {
      fit: 'contain',
      background: { r: 13, g: 110, b: 253, alpha: 1 },
    });
    if (t.padding) {
      const pad = Math.round(t.size * 0.15);
      image = image
        .extend({
          top: pad,
          bottom: pad,
          left: pad,
          right: pad,
          background: { r: 13, g: 110, b: 253, alpha: 1 },
        })
        .resize(t.size, t.size);
    }
    await image.png().toFile(out);
  }
  // Copy also root favicons if not exist
  const favPng = path.join(root, 'public', 'favicon.png');
  const favSvg = path.join(root, 'public', 'favicon.svg');
  if (!fs.existsSync(favSvg)) await fs.promises.copyFile(srcSvg, favSvg);
  if (!fs.existsSync(favPng)) {
    const svgBuffer = await fs.promises.readFile(srcSvg);
    await sharp(svgBuffer).resize(32, 32).png().toFile(favPng);
  }
  console.log('Icons generated.');
}

generate().catch((e) => {
  console.error(e);
  process.exit(0);
});
