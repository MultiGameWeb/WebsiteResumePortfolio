# BotCraft end-to-end checks

`run.sh` starts the real Worker (`worker.js`) locally with an empty local D1 database, adds one test shop, and runs `e2e.mjs` against it. No Gemini key, no Cloudflare account and no deploy are needed.

```bash
bash backend/sitecraft-ai/tests/run.sh
```

It checks: hide and show of items, rename, sections, shop name, saved answers (edit, hide, delete, add), item photos (limit of 5, replace, delete), publishing the shop page and serving it, which origins may call which endpoints, reply credits (given back when the AI fails, "no replies" when empty), the admin recharge, and the photo studio and premium voice failure paths.

Not covered (they need real keys): real Gemini answers and token counts, the AI photo clean-up, ElevenLabs voice, and the Cloudflare hosting domain. The Gemini calls fail on purpose with a fake key, which checks the failure handling.
