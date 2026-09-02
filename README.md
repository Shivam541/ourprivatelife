# Our Private Life — Direct WebRTC call

A minimal static video-call demo with manual offer/answer signaling. It has no app backend, database, analytics, signaling service, or TURN relay. To make direct calls between different cities practical, it uses Google's public STUN service for candidate discovery:

```js
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
```

The page is suitable for GitHub Pages. GitHub Pages serves it over HTTPS, which browsers require for camera and microphone access. On a local machine, use `http://localhost` rather than opening `index.html` directly if the browser refuses media permissions.

## Two-page calling flow

The app has a setup page and a dedicated full-screen call page, implemented as two views in the same browser document. This preserves the live WebRTC connection: navigating to a separate HTML page would destroy the caller's in-memory peer connection and invalidate the invite.

1. On the setup page, both people enable camera and microphone.
2. The caller creates and copies a compressed `OPL2.` invite code to the receiver using a trusted out-of-band channel.
3. The receiver uses **Paste invite** (or pastes manually), creates a response code, sends that back, and can enter the call view while the caller completes the connection.
4. The caller pastes that response and selects **Start call**. The app then switches to the dedicated call view.

The app waits for ICE gathering to be `complete` before it exports each description. In Chrome, new codes are gzip-compressed and URL-safe Base64 encoded with an `OPL2.` prefix, making them smaller for WhatsApp while keeping the app static and server-free. The app also continues to accept the older plain Base64 format. Neither format is **encryption**. The caller must keep the browser tab open; a reload invalidates the active invite.

When camera access is enabled, the app tries 2560×1440 (2K) at 30fps first, then 1920×1080 at 30fps, and finally the browser’s default camera mode. Browser encoding performance and available network bandwidth can still reduce the quality delivered to the other person.

## In-call controls

The full-screen call view contains only the two video feeds and the call controls. It can mute/unmute the microphone, turn the camera off/on, leave the call, and switch between picture-in-picture and an equal side-by-side layout similar to Google Meet. In picture-in-picture, the smaller feed stays above the main feed and can be dragged anywhere within the call area. Use **Switch** to exchange the main and floating feeds. The control bar uses five equal-width buttons on phones, preserves both feeds side-by-side in landscape, and reduces to icon-only controls on very short landscape screens so every control remains reachable.

Recording is not available in this app. The friend video is the main call view and your camera appears as a smaller picture-in-picture tile until you select the side-by-side layout control.

Setup fields, generated invite/response codes, and the selected layout are kept in browser session storage while moving between the two app views. A reload still stops the camera and invalidates a live WebRTC connection; saved signaling text can be copied again, but the caller must create a new invite before accepting a response after a reload.

## Screen sharing status

Screen sharing is not implemented yet. It can be added with the browser's `getDisplayMedia()` API without adding a backend: a basic version would replace the outgoing camera track for the existing call, then restore it when sharing ends. Keeping a camera tile and screen share visible at the same time would require a second WebRTC track and another manual offer/answer exchange.

## Privacy and reliability boundary

STUN lets each browser learn network candidates that may allow a direct connection across different home, office, or mobile networks. It does **not** carry call audio/video after a direct route is established. The STUN provider can receive network metadata, such as your public IP address.

There is no TURN fallback in this project. If either person is behind a restrictive or symmetric NAT, the direct call may still fail. That is expected—not a GitHub Pages issue.

## Use your own STUN service (optional)

To avoid the public Google STUN service, run or choose a STUN service you trust and change the URL to:

```js
const rtcConfig = {
  iceServers: [
    { urls: "stun:your-stun-server.example:3478" }
  ]
};
```

For near-universal connectivity, add a TURN server you control. TURN relays media only when direct connectivity fails, so that stronger reliability changes the original “data must never touch a server” requirement.

## Deploy to GitHub Pages

1. Create a GitHub repository and upload `index.html`, `app.js`, `styles.css`, and this README at its root.
2. In repository **Settings → Pages**, select **Deploy from a branch**, then select `main` and `/ (root)`.
3. Open the HTTPS Pages URL on each device and permit camera/microphone access.

Never send offer/answer text to someone you do not trust: it contains WebRTC connection metadata.
