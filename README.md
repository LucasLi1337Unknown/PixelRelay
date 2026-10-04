# Pixel Relay

A retro pixel chat world by Lucas — chat, meet friends, and play together.

## Open the app

**[Pixel Relay — main site](https://pixel-relay.lucasli0608.chatgpt.site/)** · currently private, with ChatGPT sign-in.

The application is hosted on **chatgpt.site**. GitHub stores the source; GitHub Pages alone cannot run the authentication, server routes, or database used by this app.

## Features

- Direct messages and owner-approved group chats
- Searchable groups, online players, and 动态 / Moments
- Island Chat: 2D movement, aliases, colors and hats
- Chess and checkers with custom SVG pieces and server-validated moves
- 你画我猜 and collaborative drawing with pens, shapes, text and undo
- Text chat and optional microphone chat in game rooms
- A maximum of 10 players per game room
- Responsive desktop and mobile layouts

## Latest release

Creating a game room now joins its creator on the server and opens it immediately. Rooms are deleted when their last player leaves, including their game chat, canvas and voice signaling records. Abandoned players expire after 75 seconds; stale empty rooms are cleaned up when the arcade is listed or another room action runs.

The tested beta features have been promoted to main without transferring beta conversations. Lucas approved a one-time reset of main application data. All 12 main data tables were verified empty after deployment; the separate Supabase sign-in accounts were preserved.

**Migration note:** `drizzle/0002_main_fresh_start.sql` is the already-applied, main-only reset migration. It deletes application records. Review it before applying these migrations to any existing database; it must not be applied to the beta database. Follow-up deployments must not replay applied migrations.

## Development

React, Vinext, Cloudflare D1, Drizzle, Supabase Auth, chess.js, and WebRTC. Node.js 22.13 or later and the pnpm version declared in `package.json` are required.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
node scripts/test-game-entry-d1.cjs
node scripts/test-multiplayer-d1.cjs
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for runtime and local D1 migration instructions. The multiplayer tests use isolated, synthetic data in a local D1 runtime; they do not touch live records.

`.openai/hosting.json` identifies the existing main Site. A new hosted copy needs its own Site identity and database. Runtime configuration and credentials are not included. Configure Supabase runtime values and an allowed `/auth/confirm` return URL before enabling email sign-in on another deployment.

ChatGPT sign-in relies on the trusted Sites gateway. Deployments elsewhere must replace that integration and must not trust visitor-supplied `oai-authenticated-user-*` headers.

## Voice

Microphone access is optional. WebRTC uses STUN without a TURN relay; restrictive networks may prevent voice connections. Text chat remains available. No microphone recording is implemented.

## Source and deployment

Source snapshot of main Site commit `574e112fc2d6e7d753008ec87b60b99cda1e96d7`. GitHub commits do not automatically deploy the chatgpt.site application. No chat history, account records, or secrets are uploaded.
