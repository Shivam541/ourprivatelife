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

The full-screen call view contains the two video feeds, call controls, and an optional **Chat** panel. Chat uses the same encrypted WebRTC peer connection as the call, with no application server or message storage. Messages and files are available only while the live call connection remains open and disappear when either person leaves. Incoming messages and completed file transfers play a brief local pop and show a blue unread dot on the Chat control until Chat is opened. Attach files up to 100 MB: common images render directly in chat, while videos, PDFs, and other document types appear with their original filename and a download button. If a browser cannot render a particular image format (for example, some HEIC images), chat shows a clear fallback and retains the original download. Files are sent unchanged—this app does not recompress them. On phones, opening Chat fills the screen; close it to return to video.

Type `/` in Chat to open an autocomplete menu; use ↑/↓ and Enter or click a suggestion. Commands: **`/clear`** clears the visible active-chat history for both people; **`/download-all`** starts downloads for every file currently visible in your own chat; **`/files`** lists available file names; **`/status`** shows local connection/file status; **`/close`** hides chat on your device; **`/mas`**, **`/gpt`**, **`/gem`**, **`/gs`**, and **`/ig`** open Cosmic Dashboard, ChatGPT, Gemini, Google Scholar, and Instagram; **`/tg`** and **`/wa`** open Telegram and WhatsApp; **`/search your terms`** opens a Google search; **`/help`** lists commands. Website and search commands run only when you type them locally and open a new tab in your browser. On a compatible Mac or mobile device, Telegram and WhatsApp may hand off to their installed apps. Clearing chat cannot remove a file the other person has already downloaded. `http://` and `https://` links in messages are clickable and open in a new tab when selected.

The call controls can mute/unmute the microphone, turn the camera off/on, leave the call, enter or exit browser full screen, and switch between picture-in-picture and an equal side-by-side layout similar to Google Meet. If iPad/iPhone/macOS browser audio is interrupted by another tab or app, a blue **Reconnect microphone** control appears; use it to request a fresh microphone track and replace the interrupted call track. Turning the camera back on obtains a fresh video track and replaces the outgoing track, so the other person receives a resumed feed rather than a frozen frame. In picture-in-picture, the smaller feed stays above the main feed and can be dragged anywhere within the call area. Use **Switch** to exchange the main and floating feeds. The **Full screen** control hides browser chrome after the call view opens; press Esc or use the control again to exit. Call controls are icon-only, with accessible labels and tooltips; they use equal-width buttons on phones and preserve both feeds side-by-side in landscape.

Recording is not available in this app. The friend video is the main call view and your camera appears as a smaller picture-in-picture tile until you select the side-by-side layout control.

Setup fields, generated invite/response codes, and the selected layout are kept in browser session storage while moving between the two app views. A reload still stops the camera and invalidates a live WebRTC connection; saved signaling text can be copied again, but the caller must create a new invite before accepting a response after a reload.

## Screen sharing

After the call and private data channel are connected, select **Share screen**. The browser lets you choose a screen, window, or browser tab. When the browser provides it, the app also sends the selected screen's computer/tab audio; this is browser- and selection-dependent, so the app cannot force computer audio to be available.

The screen is shown full-size, while a floating call tile retains both cameras. Screen media is one-way: one person is the active sender and the other is the receiver. While your friend shares, your Share screen control is unavailable; they must stop before you can become the sender. Starting or stopping a share adds/removes its WebRTC tracks and automatically renegotiates through the existing encrypted data channel; neither person needs to copy another invite or response code. A share can be stopped from the app or the browser's own sharing control. Both people must be using this version of the app for automatic screen-share renegotiation.

While viewing your friend's shared screen, select **Laser** to point at it. The pointer is sent as normalized coordinates through the existing encrypted data channel, is visible to both people, and clears automatically after roughly two seconds. It is not a persistent drawing or recording feature.

## Floating controls (desktop Chrome/Edge)

Select **Float controls** during a connected call to open an always-on-top Document Picture-in-Picture window with both camera feeds and controls for microphone, camera, screen sharing, and leaving. Use **Close float** in that window whenever it is distracting; this only closes the floating window and keeps the call in the meeting tab. The browser feature is unavailable in unsupported browsers, and closing the meeting tab also closes the floating window.

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
