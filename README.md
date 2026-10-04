# Pixel Relay

A retro pixel chat world by Lucas — chat, meet friends, and play together.

## Play the public beta

**[Open Pixel Relay Beta](https://pixel-relay-beta.lucasli0608.chatgpt.site/)**

The working app is hosted on **chatgpt.site**. This repository contains its source code. GitHub Pages cannot run the authentication, server routes, or database this app needs.

## Features

- Direct messages and group chats with owner-approved joining
- Searchable groups, online players, and 动态 / Moments
- Island Chat: 2D movement, player aliases, customizable colors and hats
- Chess and checkers with custom SVG pieces and server-validated moves
- 你画我猜 and a shared drawing canvas with pens, shapes, text, and undo
- Text chat and optional microphone chat in game rooms
- A maximum of 10 players per game room
- Supabase email sign-in and optional ChatGPT sign-in on Sites
- Responsive desktop and mobile layouts

## Beta and main site

The beta has a separate database. Test messages and player records are not copied into the main site. Promotion requires Lucas's approval and copies reviewed code only.

This source snapshot includes the game-room entry fix tested against the Cloudflare D1 runtime: all ten slots can fill, an eleventh player is blocked, and leaving frees a slot.

## Development

The app uses React, Vinext, Cloudflare D1, Drizzle, Supabase Auth, chess.js, and WebRTC.

Requirements: Node.js 22.13 or later and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
node scripts/test-game-entry-d1.cjs
```

Apply the SQL migrations in `drizzle/` in order to a fresh local D1 database. See [DEVELOPMENT.md](DEVELOPMENT.md) for starter runtime and local migration details.

Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in your own runtime environment. Add your site's `/auth/confirm` URL to the Supabase allowed redirect URLs. Email delivery depends on your Supabase email configuration. No secrets, account records, or chat history are included here.

`.openai/hosting.json` identifies the existing beta Site. A new hosted copy needs its own Site identity and database; do not deploy it as the existing beta accidentally.

ChatGPT sign-in relies on the trusted Sites gateway. A deployment elsewhere must replace that integration and must not trust visitor-supplied `oai-authenticated-user-*` headers.

## Voice chat

Microphone access is optional. Voice uses peer-to-peer WebRTC with STUN and no TURN relay, so restrictive networks can prevent voice connections. Text chat stays available. Microphone recording is not implemented.

## Source and deployment

This repository is a source snapshot of beta commit `b94aa2c9a4677c0f0214c75fd0fc205b2ca798f4`. GitHub commits do not automatically deploy the chatgpt.site version.
