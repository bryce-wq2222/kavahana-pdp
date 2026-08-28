# src/ — LEGACY build pipeline (Aug 2026). READ BEFORE RUNNING ANYTHING.

These files are archived here so they survive session/scratchpad deletion.
They were the ORIGINAL pipeline. They are **partially superseded**.

## ⛔ DO NOT RUN `shopify-page.js` OR `build-v2.js`

`pdp-clone-src.html` is **STALE**. It predates the drawer takeover and the
motion polish (commits `aab1e8c` onward), which were applied DOWNSTREAM
directly to the embed `.txt` files.

Running `shopify-page.js` regenerates `shopify-embed.txt` from this stale
source and **silently deletes the drawer** (verified 2026-08-28: rebuild
dropped the file 113KB -> 100KB and all 12 `kv-drawer` references).
`shopify-embed.txt` IS THE LIVE PAGE — pushing that is a live regression.

## Current source of truth (see SESSION-NOTES-2026-08-27.md, local-only)

- Live PDP embed .............. `shopify-embed.txt`  (never touch without Bryce's OK)
- Editable staging source ..... `shopify-embed-v2.txt`
- Replica pages rebuilt by .... `node tools/build-embeds.js`

## What is still safe here

- `build-gh.js` — still generates the standalone GH Pages `index.html` +
  `premium.html` from `pdp-clone-src.html`. Verified 2026-08-28: output is
  byte-identical to what is committed, so these two remain in sync.
  Run it from THIS directory (`cd src && node build-gh.js`); it reads
  `pdp-clone-src.html` + `wordmark.svg` relative to the working directory
  and writes to the repo root by absolute path.
- `build-okendo.js` — one-off Okendo review CSV builder (reads Downloads/).
- `patch99.js` — historical record of the Aug 19 source edits.

If the embeds ever need a rebuild from source, the stale source must first be
brought forward with the drawer + motion work. That is a real merge, not a rerun.
