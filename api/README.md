# shafwan-api

The small backend behind shafwan.in, running as a Cloudflare Worker with a D1 (SQLite) database. It does two things:

- **Lab leaderboards.** One global board per game. The server calculates every score itself, so a score can't be edited in DevTools or sent in a handcrafted request.
- **Anonymous contact notes.** A note from `/contact/` is stored and then emailed to `MAIL_TO` through Resend.

Everything runs on free tiers. D1 databases on the free plan don't pause or expire, so scores stay put even if nobody visits for months.

## How scores stay honest

| Game | What the browser sends | What the server checks and does |
|------|------------------------|---------------------------------|
| Bitwise | The time of each solve | Deals the rounds itself. Counts any solve faster than a human floor time as if it took the floor time. Rejects reported time that hasn't actually passed on the server's clock. |
| Compile | One answer at a time | Keeps the answer key; the browser never receives it. Judges and times each answer itself. Answers faster than 1 second get no extra bonus. |
| Keystroke | Elapsed time and key counts | Starts its own clock when the line is dealt, so the browser can't claim to have finished faster than real time allows. Caps scores at 180 WPM. |

A run can only be finished once and claimed once. Each Compile answer has to name the question it answers, so a resent answer can't count again or land on the next question. Play needs a Cloudflare Turnstile check, which is exchanged for a signed session that lasts two hours. Board names are checked on the server: 2–14 Latin letters, with offensive words blocked.

**What it can't stop:** a program that passes Turnstile and plays the puzzles for real, no faster than the floor times. That limit applies to every browser game.

## Deploy (one time, about 15 minutes)

You need three free accounts: **Cloudflare**, **Resend** (sign up with the address that should receive the notes, `tshafwan23@gmail.com`), and the GitHub repo you already have.

```bash
cd api
npm install
npx wrangler login                     # opens the browser; click Allow
npx wrangler d1 create shafwan         # copy the printed database_id into wrangler.toml
npm run db:remote                      # creates the tables
```

**Turnstile.** In the Cloudflare dashboard, go to Turnstile → Add widget:

- Hostnames: `shafwan.in` and `www.shafwan.in`
- Mode: Managed

Keep the **site key** (it is public) and the **secret key**.

**Resend.** Go to API Keys → Create API key, with permission set to Sending access.

Then store the three secrets. Wrangler prompts for each value, and none of them ever goes into the repo:

```bash
npx wrangler secret put SESSION_SECRET     # paste a long random string (40+ characters)
npx wrangler secret put TURNSTILE_SECRET   # the Turnstile secret key
npx wrangler secret put RESEND_API_KEY     # the Resend API key
npm run deploy                             # prints https://shafwan-api.<you>.workers.dev
```

**Connect the site.** Put the Worker URL and the Turnstile **site key** into `../.env.production` (live: `https://shafwan-api.shafwan.workers.dev`), then commit and push; Render rebuilds the site. Until both values are real, the Lab runs as unranked practice and the contact note stays hidden, so nothing on the page breaks.

Resend's shared sender (`onboarding@resend.dev`) only delivers to the email address of the Resend account itself. That's why `MAIL_TO` must be the address you signed up with. To send from your own domain later, verify it in Resend and change `MAIL_FROM`.

## Develop and test

```bash
cp .dev.vars.example .dev.vars   # local-only test keys
npm run db:local
npm run dev                      # Worker on :8787
npm test                         # unit tests
npm run test:int                 # end-to-end: real local Worker + D1, stub mailbox
```

Run `npm run dev` in the project root at the same time to get the site on `:5173`. The root `.env.development` points the site at the local Worker and uses Cloudflare's always-pass test key for Turnstile.

## Housekeeping

A cron job every 15 minutes does three things:

- deletes runs older than a day, which never touches the boards
- deletes rate-limit rows older than two days
- retries any note the mail service refused

To read stored notes directly:

```bash
npx wrangler d1 execute shafwan --remote --command "SELECT id, created_at, delivered, body FROM messages ORDER BY id DESC LIMIT 20"
```
