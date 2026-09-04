# AI Context: Our Private Life

## Purpose

**Our Private Life** is a deliberately small, static, one-to-one WebRTC video-call prototype. It is designed for two people in different cities who manually exchange a short-lived invite and response code through a separate channel they trust.

The project is intentionally dependency-free and suitable for GitHub Pages. There is no application backend, database, account system, analytics, signaling server, or build step.

## Repository map

| Path | Responsibility |
| --- | --- |
| `index.html` | App layout, controls, video elements, and manual-signaling screens. |
| `app.js` | Camera/microphone capture, WebRTC negotiation, ICE waiting, Base64 code conversion, and UI state. |
| `styles.css` | Responsive dark UI styling. |
| `README.md` | Human-facing setup, calling flow, deployment, and network limitations. |
| `docs/AI_CONTEXT.md` | This implementation context for future AI-assisted work. |

## Current architecture

```text
Caller browser                         Receiver browser
--------------                         ----------------
camera/mic → RTCPeerConnection         camera/mic → RTCPeerConnection
       │                                        │
       ├─ create offer → Base64 invite code ────┤ manual trusted channel
       │                                        │
       ├─ paste Base64 response code ←──────────┤ create answer
       │                                        │
       └──────── encrypted direct WebRTC media ─┘

                 STUN: candidate discovery only
```

`app.js` uses:

```js
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
```

The caller also creates one ordered WebRTC `RTCDataChannel` named `chat` before generating the offer. The receiver accepts it through `ondatachannel`. It uses the same live peer connection as the media, has no server or persistent history, and messages disappear when the connection closes. Plain-text chat messages and files share this channel. Files are sent uncompressed in 12 KB Base64 chunks to respect browser data-channel message limits; the recipient reassembles the original MIME type and filename locally. Limit a file to 100 MB to avoid exhausting browser memory.

The public STUN service helps both browsers discover possible direct routes across different networks. It does **not** relay a successful call's audio/video. STUN can learn network metadata such as the user's public IP address.

There is intentionally no TURN server. Therefore, calls can fail on restrictive firewalls or symmetric NAT. Adding TURN is a deliberate product/privacy decision because TURN relays media when a direct route cannot be made.

## Important technical truths

1. WebRTC offer/answer exchange is manual. The app has no server-based signaling or friend discovery.
2. The offer and answer are WebRTC session descriptions. New codes use standard Base64 for broad browser compatibility; the UI can still decode a prior compressed `OPL2.` code in a supporting browser. Both formats only make copy/paste less awkward. **Neither format is encryption.**
3. WebRTC transport is encrypted by the browser; this app does not implement an extra password-based encryption layer.
4. The app waits for `iceGatheringState === "complete"` before serializing local descriptions. This ensures candidates gathered at that point are included in the copied code.
5. A caller's `RTCPeerConnection` lives only in JavaScript memory. Reloading, closing, or navigating away from the caller tab invalidates that invite. Do not imply that localStorage alone can preserve an active call; it cannot preserve the live browser connection state.
6. GitHub Pages hosts only the static files over HTTPS. It does not carry signaling or successful direct media traffic.
7. Camera/microphone access needs HTTPS (GitHub Pages) or a browser secure local context such as `localhost`.

## User flow and UI state

The interface has two full-screen app views in one document: the setup view and the call view. They are not separate HTML navigations because a `RTCPeerConnection` cannot survive a navigation. Compact setup/signaling text and the selected layout are retained in tab-scoped `sessionStorage`; a reload still ends the live camera/WebRTC session and the caller must create a new invite.

### Caller

1. Select **Enable camera & microphone** and grant browser permission.
2. Select **Create invite**. The app creates a peer connection, waits for ICE gathering, stores the Base64 invite in the current browser session, and reveals **Copy invite code**.
3. Send the invite code to the receiver through an out-of-band channel.
4. Select **Paste response** (or paste manually) into the single caller input and select **Start call**.
5. The dedicated call view opens. Keep the tab open until connected or disconnected.

### Receiver

1. Select **Paste invite** (or paste the received invite code manually) into the visible input.
2. Select **Accept invite & create response**. The app requests camera/microphone access if needed, produces a response, and hides the invite input.
3. Copy and send the response code back to the caller, then select **Enter call**.

After both descriptions are set, the call view shows a short authentication string: four emojis and a six-digit code derived from the normalized local and remote SDP fingerprint lines. Both people compare it using a trusted separate channel. If it differs, leave the call. A match confirms the same fingerprint set, not the friend's real-world identity.

Only the relevant text input should be visible at a time. Do not reintroduce exposed JSON textareas as output; codes are copied with buttons and can be pasted from the clipboard with a user-initiated control (manual paste remains the fallback if clipboard permission is unavailable). The call view contains the feeds plus mic, camera, layout, switch-screen, full-screen, chat, and leave controls. If a microphone track ends or becomes muted by an iPad/iPhone/macOS browser audio-session interruption, show a blue **Reconnect microphone** control. It must acquire a fresh audio-only track after the user taps it, replace the existing WebRTC sender track, stop/remove stale local audio tracks, and remain a retryable explicit user action if device access fails. Chat must remain a transient data-channel feature: enable it only when the channel is open, close only the panel when the user toggles it, and clear messages and object URLs when the call ends. An incoming text message or completed file transfer must play a short generated local pop after a user gesture has enabled browser audio. If Chat is closed, it must also show a blue unread dot on its control, set an accessible “new messages” label, and clear the indicator when Chat opens or history clears. Typing `/` opens a filtered command menu; it must support click, ↑/↓ + Enter selection, Escape dismissal, and accessible listbox semantics. `/clear` sends a dedicated data-channel event that clears both active chat views, but cannot revoke a previously downloaded file. Keep `/download-all`, `/files`, `/status`, `/close`, `/mas`, `/gpt`, `/gem`, `/gs`, `/ig`, `/tg`, `/wa`, `/search`, and `/help` local-only utility commands: they must never run from received messages. `/mas`, `/gpt`, `/gem`, `/gs`, `/ig`, `/tg`, `/wa`, and `/search query` open a user-initiated new browser tab with `noopener,noreferrer`; Telegram and WhatsApp may hand off to an installed app, but the static app cannot require this or select Chrome over another default browser. Only `http://` and `https://` URLs become links, using `noopener noreferrer` and a user click to open a new tab. Treat common image MIME types and image file extensions as inline previews. A preview load failure (such as an unsupported HEIC codec) must retain the download and show a clear browser-compatibility fallback. Videos, PDFs, and other file types appear as full-name download cards, preserving the original uploaded bytes. On phones, the chat panel fills the screen and its close control returns to video. Recording is deliberately unavailable. The full-screen control uses the browser Fullscreen API to hide browser chrome; it must reflect an Esc/system exit and be disabled when unavailable. The layout control switches between picture-in-picture and side-by-side feeds in landscape. Portrait always shows two equal stacked panels; neither tile can float or be dragged. Call-control labels are visually hidden at every size, but their accessible labels and tooltips must remain available.

### Screen sharing

After the peer connection and its `chat` data channel are open, `getDisplayMedia()` may add a screen video track and, only when the browser supplies it, a computer/tab audio track. Screen media is one-way: one active sender and one receiver. When `screen-share-state` says the friend is sharing, disable the local Share screen control until that state ends; do not permit simultaneous screen streams. The call UI shows the screen as the main stage and both cameras in a draggable floating tile. The data channel carries internal `webrtc-offer` and `webrtc-answer` messages for automatic renegotiation; users must never exchange another manual code. Use the existing caller/receiver role as the polite/impolite perfect-negotiation roles so simultaneous renegotiation can recover from an offer collision. Removing the screen tracks must renegotiate again and stop capture tracks. Browser/OS choice determines whether computer audio is available, so do not promise it.

## Editing guidance

### Preserve by default

- The static, no-build, GitHub-Pages-compatible deployment model.
- Manual copy/paste signaling unless a signaling service is explicitly requested.
- The current direct-media-first configuration: STUN allowed, TURN absent.
- The explicit privacy limitation language. Do not claim that this is “zero server” while public STUN is configured.
- The caller reload limitation and clear user-facing error message.
- `autoplay`, `playsinline`, and `muted` on the local video element; these reduce browser playback friction, especially in Chrome.
- Camera capture tries 2560×1440 (2K) at 30fps, then 1920×1080 at 30fps, then the browser default. WebRTC can still adapt transmitted quality for device performance or network conditions.

### Treat as explicit scope changes

- Adding TURN, a signaling server, authentication, contact discovery, persistent invite links, data storage, analytics, or recording.
- Replacing the configured STUN service or adding TURN credentials.
- Claiming end-to-end encryption beyond WebRTC's transport security or adding password-derived encryption.
- Supporting group calls; the current implementation is one caller and one receiver only.

### When changing WebRTC code

- Keep `setLocalDescription()` before waiting for ICE completion.
- Export `pc.localDescription`, not the initial value returned by `createOffer()` or `createAnswer()`, because candidates accumulate in the local description.
- Validate decoded content has the expected `type` (`offer` or `answer`) and `sdp` before passing it to `setRemoteDescription()`.
- Stop media tracks in `disconnect()` and clear both video `srcObject` values.
- Update both the app UI and `README.md` when user-visible networking/privacy behavior changes.

## Validation

There is no dependency installation or test suite. Run these focused checks after edits:

```bash
node --check app.js
git diff --check
```

Manual Chrome test checklist:

1. Serve locally through `localhost`, or deploy to GitHub Pages HTTPS.
2. Open the site in two separate browser contexts/devices.
3. Complete the caller/receiver exchange without reloading either tab.
4. Confirm local and remote video render, status reaches `connected`, and **Disconnect** releases camera/microphone.
5. Confirm **Chat** becomes available after connection, sends plain text and a 100 MB-or-smaller image/file in both directions, renders images inline, preserves file names/types, clears for both peers after `/clear`, and clears after **Disconnect**. On iPad/iPhone/macOS, interrupt the audio session with another tab/app, return, and verify **Reconnect microphone** obtains a new track without reconnecting the call.
6. Test the caller reload path: accepting the old response must give a clear message and require a new invite.

## Deployment

Upload the repository root to GitHub. In **Settings → Pages**, deploy from the selected branch and root directory. Open the resulting HTTPS URL in Chrome and allow camera/microphone permissions.

This repository does not contain deployment credentials or domain configuration. `ourprivatelife.com` is app branding only unless the project owner separately configures and owns that domain.
