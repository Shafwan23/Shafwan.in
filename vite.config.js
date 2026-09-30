import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        work: resolve(__dirname, 'work/index.html'),
        famysys: resolve(__dirname, 'work/famysys/index.html'),
        servicenow: resolve(__dirname, 'work/servicenow/index.html'),
        myfundbox: resolve(__dirname, 'work/myfundbox/index.html'),
        sih2023: resolve(__dirname, 'work/sih-2023/index.html'),
        experience: resolve(__dirname, 'experience/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        lab: resolve(__dirname, 'lab/index.html'),
      },
    },
  },
});
