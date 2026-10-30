// Optimiza fotografías y genera los recursos de marca (logo web, favicon, imagen para compartir).
// Uso (solo cuando agregues o cambies imágenes):
//   npm install --no-save sharp
//   node scripts/optimize-images.mjs <carpeta-con-fotos-originales>
// Las fotos originales NO se guardan en el repositorio; solo las versiones optimizadas de public/images.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch {
  try { sharp = require(process.env.SHARP_PATH || 'sharp'); } catch {
    console.error('Falta "sharp". Ejecuta: npm install --no-save sharp'); process.exit(1);
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
const photosOut = join(root, 'public/images/photos');
const brandOut = join(root, 'public/images/brand');
mkdirSync(photosOut, { recursive: true });
mkdirSync(brandOut, { recursive: true });

// nombre-de-archivo-fuente -> { name, widths }
const photos = {
  'qs-hero-dusk.jpg': { name: 'hero-dusk', widths: [2000, 1280, 800] },
  'qs-hero-villa.jpg': { name: 'hero-villa', widths: [2000, 1280, 800] },
  'qs-hero-living.jpg': { name: 'hero-living', widths: [2000, 1280, 800] },
  'qs-hero-pool.jpg': { name: 'hero-pool', widths: [2000, 1280, 800] },
  'qs-about-architecture.jpg': { name: 'about-architecture', widths: [1400, 800] },
  'qs-process-kitchen.jpg': { name: 'process-kitchen', widths: [1400, 800] },
  'qs-contact-aerial.jpg': { name: 'contact-aerial', widths: [1600, 900] },
  'qs-notfound-facade.jpg': { name: 'notfound-facade', widths: [1600, 900] },
};

if (src) {
  for (const [file, { name, widths }] of Object.entries(photos)) {
    const p = join(src, file);
    if (!existsSync(p)) { console.warn('No encontrado:', p); continue; }
    for (const w of widths) {
      await sharp(p).rotate().resize({ width: w, withoutEnlargement: true })
        .webp({ quality: w >= 1800 ? 72 : 74, effort: 6 })
        .toFile(join(photosOut, `${name}-${w}.webp`));
    }
    // JPEG solo para la foto que alimenta la imagen para compartir (og-image)
    if (name === 'hero-dusk') await sharp(p).rotate().resize({ width: 1280 }).jpeg({ quality: 76, mozjpeg: true, progressive: true })
      .toFile(join(photosOut, `${name}-1280.jpg`));
    console.log('✓', name);
  }
}

// ---------- Marca ----------
const brandSrc = join(root, 'brand-source');
const logo = join(brandSrc, 'logo-recortado-transparente.png');
const mark = join(brandSrc, 'simbolo-transparente.png');

for (const h of [128, 64]) {
  await sharp(logo).resize({ height: h }).png({ compressionLevel: 9 }).toFile(join(brandOut, `logo-${h}.png`));
  await sharp(logo).resize({ height: h }).webp({ quality: 92, alphaQuality: 100 }).toFile(join(brandOut, `logo-${h}.webp`));
}
await sharp(logo).resize({ width: 1200 }).png({ compressionLevel: 9 }).toFile(join(brandOut, 'logo-1200.png'));

// Favicon e íconos: símbolo centrado en un lienzo cuadrado
async function squareMark(size, bg, pad = 0.1) {
  const inner = Math.round(size * (1 - pad * 2));
  const m = await sharp(mark).resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: m, gravity: 'center' }]).png({ compressionLevel: 9 });
}
const clear = { r: 0, g: 0, b: 0, alpha: 0 };
const ivory = { r: 250, g: 247, b: 240, alpha: 1 };
await (await squareMark(32, clear, 0.02)).toFile(join(root, 'public/favicon-32.png'));
await (await squareMark(180, ivory, 0.12)).toFile(join(root, 'public/apple-touch-icon.png'));
await (await squareMark(192, ivory, 0.12)).toFile(join(root, 'public/icon-192.png'));
await (await squareMark(512, ivory, 0.12)).toFile(join(root, 'public/icon-512.png'));

// favicon.ico con PNG incrustados (16, 32, 48)
const icoSizes = [16, 32, 48];
const pngs = [];
for (const s of icoSizes) pngs.push(await (await squareMark(s, clear, 0.02)).toBuffer());
const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
let offset = 6 + 16 * pngs.length; const dir = [];
pngs.forEach((buf, i) => {
  const e = Buffer.alloc(16); const s = icoSizes[i];
  e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(offset, 12);
  offset += buf.length; dir.push(e);
});
writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([header, ...dir, ...pngs]));

// Imagen para compartir (1200x630): panel marfil con logo + fotografía
const heroForOg = join(photosOut, 'hero-dusk-1280.jpg');
if (existsSync(heroForOg)) {
  const photo = await sharp(heroForOg).resize(560, 630, { fit: 'cover', position: 'centre' }).toBuffer();
  const lg = await sharp(logo).resize({ width: 520 }).png().toBuffer();
  const rule = Buffer.from('<svg width="4" height="630"><rect width="4" height="630" fill="#B08A4A"/></svg>');
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: { r: 250, g: 247, b: 240 } } })
    .composite([{ input: lg, left: 60, top: 203 }, { input: rule, left: 636, top: 0 }, { input: photo, left: 640, top: 0 }])
    .jpeg({ quality: 82, mozjpeg: true }).toFile(join(root, 'public/images/brand/og-image.jpg'));
}
console.log('✓ marca e íconos');
