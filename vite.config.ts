import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs';

// publicフォルダをビルド出力にコピーするプラグイン
function copyPublicPlugin() {
  return {
    name: 'copy-public',
    closeBundle() {
      const outDir = 'OfflineAIPromptGenerator';
      const publicDir = 'public';

      // publicフォルダの内容を再帰的にコピー（popup.htmlは除く）
      function copyDir(src: string, dest: string) {
        if (!existsSync(dest)) {
          mkdirSync(dest, { recursive: true });
        }
        const entries = readdirSync(src);
        for (const entry of entries) {
          const srcPath = resolve(src, entry);
          const destPath = resolve(dest, entry);
          if (statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            // popup.htmlは除外（Viteがビルド済み）
            if (entry !== 'popup.html') {
              copyFileSync(srcPath, destPath);
            }
          }
        }
      }

      copyDir(publicDir, outDir);

      // 不要なルートのpopup.htmlを削除
      const rootPopupHtml = resolve(outDir, 'popup.html');
      if (existsSync(rootPopupHtml)) {
        unlinkSync(rootPopupHtml);
        console.log('✓ Removed duplicate popup.html from root');
      }

      console.log('✓ Public files copied to output directory');
    },
  };
}

export default defineConfig({
  plugins: [react(), copyPublicPlugin()],
  base: './', // 相対パスで出力（Chrome拡張機能用）
  build: {
    outDir: 'OfflineAIPromptGenerator',
    emptyDirBeforeWrite: true,
    minify: false, // デバッグしやすくするため
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // service-workerはルートに配置
          if (chunkInfo.name === 'service-worker') {
            return '[name].js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
