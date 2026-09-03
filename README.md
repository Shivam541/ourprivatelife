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

Browser Back navigation is locked for this tab, including history gestures and Backspace outside a text field. Use the app’s **Leave** control to end a call, or close the tab/window when finished.

1. On the setup page, both people enable camera and microphone.
2. The caller creates and copies an invite code to the receiver using a trusted out-of-band channel.
3. The receiver uses **Paste invite** (or pastes manually), creates a response code, and can either copy it on the setup view or enter the call. Once in the call, **Copy** remains available in the call controls until they leave.
4. The caller pastes that response and selects **Start call**. The app then switches to the dedicated call view.

Once both people enter the call, each sees the same four emoji and six-digit verification phrase. Compare it using the separate channel you trust before discussing anything private. A mismatch means leave the call. A match confirms that both screens derived the phrase from the same WebRTC fingerprints; it does not independently prove the other person's real-world identity.

The app waits for ICE gathering to be `complete` before it exports each description. The current invite/response format is standard Base64 for the broadest browser compatibility; the app can still accept a previously issued compressed `OPL2.` code in a supporting browser. Neither format is **encryption**. The caller must keep the browser tab open; a reload invalidates the active invite.

When camera access is enabled, the app tries 2560×1440 (2K) at 30fps first, then 1920×1080 at 30fps, and finally the browser’s default camera mode. Browser encoding performance and available network bandwidth can still reduce the quality delivered to the other person.

The browser can share a microphone with another tab or app only when the operating system and device driver allow it. This app cannot read audio already captured by Google Meet or override an exclusive microphone lock. If the microphone becomes unavailable during an active call, end the other call or release that microphone, then select **Mic** in this app to reconnect it without ending the WebRTC call.

## In-call controls

The full-screen call view contains only the two video feeds and the call controls. It can mute/unmute the microphone, turn the camera off/on, leave the call, enter or exit browser full screen, and switch between picture-in-picture and an equal side-by-side layout similar to Google Meet. Turning the camera back on obtains a fresh video track and replaces the outgoing track, so the other person receives a resumed feed rather than a frozen frame. In picture-in-picture, the smaller feed stays above the main feed and can be dragged anywhere within the call area. Use **Switch** to exchange the main and floating feeds. The **Full screen** control hides browser chrome after the call view opens; press Esc or use the control again to exit. The control bar uses equal-width buttons on phones, preserves both feeds side-by-side in landscape, and reduces to icon-only controls on very short landscape screens so every control remains reachable.

Recording is not available in this app. The friend video is the main call view and your camera appears as a smaller picture-in-picture tile until you select the side-by-side layout control.

Setup fields, generated invite/response codes, and the selected layout are kept in browser session storage while moving between the two app views. A reload still stops the camera and invalidates a live WebRTC connection; saved signaling text can be copied again, but the caller must create a new invite before accepting a response after a reload.

## Screen sharing status

Screen sharing is not implemented yet. It can be added with the browser's `getDisplayMedia()` API without adding a backend: a basic version would replace the outgoing camera track for the existing call, then restore it when sharing ends. Keeping a camera tile and screen share visible at the same time would require a second WebRTC track and another manual offer/answer exchange.

## Privacy and reliability boundary

STUN lets each browser learn network candidates that may allow a direct connection across different home, office, or mobile networks. It does **not** carry call audio/video after a direct route is established. The STUN provider can receive network metadata, such as your public IP address.

Invite and response codes are encoding, not encryption. Send them only through a channel where you can recognize your friend. The in-call verification phrase helps detect a signaling man-in-the-middle only when both people compare it using a separate channel the attacker cannot alter.

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
