import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm.js',
      '@': resolve(__dirname, 'src'),
    },
  },
  publicDir: 'assets',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'chart.js', '@supabase/supabase-js', 'html2pdf.js', 'bootstrap'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
