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

      // publicフォルダの内容を再帰的にコピー（HTMLは除く）
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
            // HTMLファイルは除外（Viteがビルド済み）
            if (!entry.endsWith('.html')) {
              copyFileSync(srcPath, destPath);
            }
          }
        }
      }

      copyDir(publicDir, outDir);

      // 不要なルートのHTMLファイルを削除
      const filesToRemove = ['popup.html', 'options.html'];
      for (const file of filesToRemove) {
        const filePath = resolve(outDir, file);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }

      console.log('✓ Public files copied to output directory');
    },
  };
}

export default defineConfig({
  plugins: [react(), copyPublicPlugin()],
  base: './',
  build: {
    outDir: 'OfflineAIPromptGenerator',
    emptyDirBeforeWrite: true,
    minify: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
        options: resolve(__dirname, 'public/options.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
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
