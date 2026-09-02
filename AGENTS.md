# Agent Guide — Our Private Life

Before changing this repository, read [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md) in full. It is the authoritative implementation guide for the app’s architecture, WebRTC constraints, privacy language, and validation steps.

## Working rules

- Keep the app static, dependency-free, and compatible with GitHub Pages.
- Preserve manual offer/answer signaling and the direct-media-first STUN-only configuration unless a change is explicitly requested.
- Treat TURN, server-side signaling, accounts, analytics, persistent storage, group calls, recording changes, and screen sharing as deliberate scope changes; document their privacy and user-flow effects.
- When touching WebRTC, preserve ICE-gathering behavior, validate incoming descriptions, stop tracks on disconnect, and retain the caller reload limitation.
- For UI work, keep local and remote video controls accessible, including labels for icon-only controls.

## Validation

Run the focused checks described in the AI context before handing off changes:

```bash
node --check app.js
git diff --check
```
