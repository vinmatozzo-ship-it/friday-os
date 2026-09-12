# friday-os

Backend + minimal phone UI for a personal assistant that routes chat requests
to Claude, GPT, Kimi, or Qwen, with memory persisted in the **Paradigm
Command Center** Supabase project (`sessions`, `messages`, `agent_memory`
tables -- already live, shared with other PVG tools).

## How it works

- `netlify/functions/chat.js` -- the API. Loads recent session history +
  recent `agent_memory` entries, calls the selected provider, saves the
  exchange back to Supabase.
- `public/index.html` -- a single mobile-friendly chat page that calls
  `/api/chat`.
- `src/lib/providers.js` -- one adapter per model provider.

## Required setup (you need to do this -- none of this is done yet)

1. **Supabase service role key.** In the Paradigm Command Center project
   (`ggwwhsueqxgqtwokxrsu`), grab the service role key (Project Settings ->
   API). Do not use the anon key here -- this function needs write access.
2. **Provider API keys** for whichever of Claude/GPT/Kimi/Qwen you want live.
   You only need to set the ones you'll use.
3. **`APP_SHARED_SECRET`** -- make up a long random string. This is the only
   thing standing between this endpoint and the open internet once deployed,
   since Netlify function URLs are public by default. The web UI will ask
   for it once and store it in `localStorage`.
4. Copy `.env.example` to `.env` and fill in the above for local dev, and set
   the same keys as Netlify environment variables for the deployed site
   (Site settings -> Environment variables, or ask me to set them once you
   give me the values -- I won't ask you to paste secrets in chat, set them
   directly in the Netlify dashboard).

## Local dev

```
npm install
npx netlify dev
```

## Deploy

Connected to Netlify via GitHub. Push to this repo's branch and Netlify
builds from `netlify.toml` (publishes `public/`, functions from
`netlify/functions`).

## Not built yet

- PVG Brain (OneDrive) connector -- needs a Microsoft Graph app registration
  (Azure AD) before any code can call it. See the "PVG Brain connector"
  task.
- Auth beyond the single shared secret (fine for one user on one phone, not
  fine for a team).
- Streaming responses (current implementation waits for the full reply).
