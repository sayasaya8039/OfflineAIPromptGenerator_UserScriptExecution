/**
 * SVGアイコンをPNG形式で生成するスクリプト
 * 実行: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// SVGアイコン（水色系のAI風デザイン）
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38BDF8"/>
      <stop offset="100%" style="stop-color:#7DD3FC"/>
    </linearGradient>
  </defs>
  <!-- 背景 -->
  <rect width="128" height="128" rx="24" fill="url(#bg)"/>
  <!-- AIの脳イメージ -->
  <circle cx="64" cy="50" r="28" fill="none" stroke="#0C4A6E" stroke-width="4"/>
  <circle cx="52" cy="42" r="4" fill="#0C4A6E"/>
  <circle cx="76" cy="42" r="4" fill="#0C4A6E"/>
  <path d="M50 56 Q64 68 78 56" fill="none" stroke="#0C4A6E" stroke-width="3" stroke-linecap="round"/>
  <!-- コードブラケット -->
  <text x="28" y="105" font-family="monospace" font-size="32" font-weight="bold" fill="#0C4A6E">{</text>
  <text x="88" y="105" font-family="monospace" font-size="32" font-weight="bold" fill="#0C4A6E">}</text>
  <!-- 稲妻（実行） -->
  <polygon points="64,78 56,94 62,94 58,110 72,90 66,90 70,78" fill="#FDE68A"/>
</svg>`;

const sizes = [16, 48, 128];
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// ディレクトリ作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// SVGファイルを出力（各サイズ用のviewBox調整版）
sizes.forEach(size => {
  const outputPath = path.join(outputDir, `icon${size}.svg`);
  fs.writeFileSync(outputPath, svgIcon);
  console.log(`Created: ${outputPath}`);
});

// メインSVGも保存
fs.writeFileSync(path.join(outputDir, 'icon.svg'), svgIcon);
console.log('\\nSVGアイコンを生成しました。');
console.log('PNGに変換するには、ブラウザでSVGを開いてスクリーンショットを撮るか、');
console.log('オンラインツール（例: cloudconvert.com）を使用してください。');
