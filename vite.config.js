import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    viteSingleFile({
      // Inline CSS and JavaScript into a single HTML file
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true
    })
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // Inline all assets
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      inlineDynamicImports: true,
      output: {
        // manualChunks is not compatible with inlineDynamicImports
        // The singlefile plugin handles chunking automatically
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  base: './'
});
