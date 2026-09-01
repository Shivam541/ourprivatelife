# Our Private Life — Direct WebRTC call

A minimal static video-call demo with manual offer/answer signaling. It has no app backend, database, analytics, signaling service, or TURN relay. To make direct calls between different cities practical, it uses Google's public STUN service for candidate discovery:

```js
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
```

The page is suitable for GitHub Pages. GitHub Pages serves it over HTTPS, which browsers require for camera and microphone access. On a local machine, use `http://localhost` rather than opening `index.html` directly if the browser refuses media permissions.

## Calling flow

1. Both people open the same deployed page and press **Start camera & microphone**.
2. Caller creates and copies a compact Base64 invite code to the receiver using a trusted out-of-band channel.
3. Receiver pastes it, creates a response code, and sends that back.
4. Caller pastes that answer into the final box and presses **Accept answer**.

The app waits for ICE gathering to be `complete` before it exports each description. Base64 makes copying easier, but it is **not encryption**. The caller must keep the browser tab open; a reload invalidates the active invite.

## In-call controls and recording

Once camera and microphone access is granted, the call controls can mute/unmute the microphone and turn the camera off/on without disconnecting. The incoming friend video can also be recorded locally at a selected 720p or 1080p WebM output size; choose the quality, press the record icon, then press it again to stop and download the file.

Recording is entirely browser-local and does not upload media to this app, but it is a sensitive action. Get the other participant's clear consent before starting. The selected output size does not create detail that is absent from the incoming video—a 1080p file may upscale a lower-resolution stream.

The friend video is the main call view; your camera is a movable, resizable tile. Use the icon controls in a video footer to pin a view, enter browser full screen, or minimize back to the tiled call view. Pinned view keeps the other feed as a movable tile. The microphone, camera, record, and hang-up controls use icons with hover labels.

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
