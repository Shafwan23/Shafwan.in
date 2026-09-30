import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';

const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

/* dev only: unknown paths get the real 404 page, the way Render serves it in production */
const notFoundPage = () => ({
  name: 'shafwan-404',
  configureServer(server) {
    /* runs after Vite's html fallback (which has already rewritten /about/ to /about/index.html)
       and before its html serving, so anything that maps to a real file passes through */
    return () => server.middlewares.use(async (req, res, next) => {
      if (req.method !== 'GET' || !(req.headers.accept || '').includes('text/html')) return next();
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      if (isFile(resolve(__dirname, '.' + url)) || isFile(resolve(__dirname, 'public', '.' + url))) return next();
      if (existsSync(resolve(__dirname, '.' + url, 'index.html'))) { res.statusCode = 301; res.setHeader('Location', url + '/'); return res.end(); }
      try {
        const html = await server.transformIndexHtml('/404.html', readFileSync(resolve(__dirname, '404.html'), 'utf8'));
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      } catch (err) { next(err); }
    });
  },
});

export default defineConfig({
  appType: 'mpa',
  plugins: [notFoundPage()],
  server: {
    /* 3000 is taken by other local Next.js apps; sharing it made Chrome send
       some requests (often the stylesheet) to the wrong server */
    port: 5173,
    strictPort: true,
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
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
});
