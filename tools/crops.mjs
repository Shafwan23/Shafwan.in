// Case-study detail crops: two zoomed regions per project image.
import sharp from 'sharp';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = {
  famysys: 'src/assets/projects/dashboard_ui.png',
  servicenow: 'src/assets/projects/crypto_ui.png',
  myfundbox: 'src/assets/projects/eco_mobile_ui.png',
  sih-2023: 'src/assets/projects/music_daw_ui.png',
};
const REGIONS = [
  { suffix: 'd1', left: 0, top: 96, width: 640, height: 440 },
  { suffix: 'd2', left: 384, top: 500, width: 640, height: 440 },
];

for (const [slug, rel] of Object.entries(SRC)) {
  for (const r of REGIONS) {
    const out = path.join(ROOT, `public/img/${slug}-${r.suffix}.webp`);
    const info = await sharp(path.join(ROOT, rel))
      .extract({ left: r.left, top: r.top, width: r.width, height: r.height })
      .webp({ quality: 80 })
      .toFile(out);
    console.log(`${slug}-${r.suffix}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
  }
}
