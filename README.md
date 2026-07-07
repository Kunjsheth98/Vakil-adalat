# Vakil Adalat

A courtroom bluffing game — argue absurd cases, call each other's bluffs, and let the verdict decide. Built for two, or a whole room.

Nothing to install. It's a static site — three files of HTML/CSS/JS and no build step.

## Deploy it (GitHub Pages, 2 minutes)

1. Create a new GitHub repo (e.g. `vakil-adalat`).
2. Push everything in this folder to it.
3. Go to the repo's **Settings → Pages**, set source to the `main` branch, root folder.
4. Your game is live at `https://<your-username>.github.io/vakil-adalat/`.

That link is what you send Khushi. Works on phone or desktop, no app to install.

## The four ways to play

- **Pass & Play** — two of you, one phone, passed back and forth each turn. Fully self-contained, works with zero setup.
- **Party Mode** — 3 to 6 players. Two duel, and whoever isn't dueling takes a turn as the human Judge who rules on objections. Also fully self-contained.
- **Daily Docket** — solo against a simple in-game opponent ("House"), same case for everyone on a given day (it's picked by the date, so anyone opening the game that day gets the same case — good for comparing scores with a screenshot in a group chat).
- **Play Online** — two separate phones, live. This one needs a five-minute setup (below); everything else works immediately with no setup at all.

## Turning on "Play Online"

Online play uses your existing Supabase project's Realtime feature — no new database tables needed, since the game itself only needs live messaging between two devices, not storage.

1. Open your Supabase project dashboard.
2. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public key**.
3. Open `js/config.js` and fill in:
   ```js
   const SUPABASE_CONFIG = {
     url: "https://your-project.supabase.co",
     anonKey: "your-anon-key",
   };
   ```
4. Make sure Realtime is enabled for your project (it's on by default for new Supabase projects — nothing else to configure).
5. Push the updated `config.js`. Play Online will now work.

**Worth knowing:** online mode trusts both devices the same way pass-and-play trusts both people on one device — it doesn't hide data at the network level, so a player digging through their browser's dev tools could technically see the other side's hand. For a game between you, Khushi, and her sisters, that's the right tradeoff — it kept the whole thing buildable without standing up a separate backend server. If you ever want a fully cheat-proof version, that's a clean future add-on (a small FastAPI referee on Railway, matching your other projects' stack) — but it's not needed for this to work well today.

## Adding more cases later

Everything the game knows about cases lives in `js/data.js`, in the `CASES` array. To add one, copy the shape of an existing case exactly — six evidence entries, three marked `owner: "A"`, three `owner: "B"` — and it's automatically in rotation. No other file needs to change.

## Adding art (optional)

The game ships with a clean CSS-only look (no images needed) — mahogany and brass courtroom theme. If you want illustrated backgrounds or a card texture instead, see `IMAGE_PROMPTS.md` for exact prompts to paste into ChatGPT or Gemini, plus where each image would go.

## What's under the hood

- `index.html` — all screens
- `css/style.css` — the whole visual theme
- `js/data.js` — every case, evidence card, argument type, judge flavor line
- `js/engine.js` — scoring, objection resolution, ranks
- `js/state.js` — profiles, points, streaks, saved in the browser (`localStorage`) — no login, no account
- `js/multiplayer.js` — the online layer (see above)
- `js/config.js` — where your Supabase keys go
- `js/app.js` — wires everything into the actual game screens

No frameworks, no build tools, nothing to run locally. Open `index.html` directly in a browser to test, or deploy as above.
