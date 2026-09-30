# shafwan.in

Portfolio of Shafwan Ahmed, full stack software engineer in Chennai.

Static multi-page site built with Vite 5, plain JavaScript and a hand-written WebGL scene. No framework.

```bash
npm ci
npm run dev      # local dev server
npm run build    # production build into dist/
npm run indexnow # after a deploy: tell Bing/Yandex/Naver the sitemap URLs changed (Google: Search Console)
```

Deploys to Render as a static site; see `render.yaml`.

The Lab leaderboards and the anonymous contact note run on a small Cloudflare Worker in [`api/`](api/README.md). Scores there are computed server-side, not trusted from the browser.
