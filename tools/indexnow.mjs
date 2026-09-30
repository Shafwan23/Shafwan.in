/* Tell the IndexNow engines (Bing, Yandex, Naver, Seznam, Yep) that shafwan.in changed.
   Google does not take IndexNow: submit the sitemap in Search Console instead.
   Run after every deploy:  npm run indexnow
   The key is public by design; it only lets someone submit this host's own URLs. */
const HOST = 'shafwan.in';
const KEY = '25cf0ff071885ffdfef8366c80238863';

const sitemap = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) throw new Error('no URLs in the sitemap');
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urls.length} URLs`);
if (res.status !== 200 && res.status !== 202) { console.log(await res.text()); process.exit(1); }
