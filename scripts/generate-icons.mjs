/**
 * SVGアイコンをPNG形式に変換するスクリプト
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const iconDir = resolve(rootDir, 'public/icons');

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  const svgPath = resolve(iconDir, 'icon.svg');
  const svgBuffer = readFileSync(svgPath);

  console.log('Generating PNG icons from SVG...');

  for (const size of sizes) {
    const outputPath = resolve(iconDir, `icon${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  Created: icon${size}.png`);
  }

  console.log('Done!');
}

generateIcons().catch(console.error);
