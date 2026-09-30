// One-shot image optimizer: source assets -> public/img WebP at display-appropriate sizes.
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/img');
mkdirSync(OUT, { recursive: true });

const JOBS = [
  { src: 'src/assets/me.jpg', out: 'me-900.webp', width: 900, q: 80 },
];

for (const job of JOBS) {
  const img = sharp(path.join(ROOT, job.src)).rotate(); // respect EXIF orientation
  const meta = await img.metadata();
  const info = await img
    .resize({ width: job.width, withoutEnlargement: true })
    .webp({ quality: job.q })
    .toFile(path.join(OUT, job.out));
  console.log(`${job.out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB (src ${meta.width}x${meta.height})`);
}
