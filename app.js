/*
 * Cross-city direct-call configuration.
 * STUN discovers network candidates, but does not relay successful call media.
 * No TURN relay is configured. Replace this public STUN service with your own
 * STUN server if you do not want to disclose network metadata to Google.
 */
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

let peerConnection;
let localStream;
const $ = (id) => document.getElementById(id);
const elements = {
  localVideo: $("localVideo"), remoteVideo: $("remoteVideo"),
  start: $("startCameraButton"), createOffer: $("createOfferButton"),
  createAnswer: $("createAnswerButton"), acceptAnswer: $("acceptAnswerButton"),
  disconnect: $("disconnectButton"), localOffer: $("localOffer"),
  remoteOffer: $("remoteOffer"), localAnswer: $("localAnswer"), remoteAnswer: $("remoteAnswer"),
  statusText: $("statusText"), statusDot: $("statusDot")
};

function setStatus(message, state = "idle") {
  elements.statusText.textContent = message;
  elements.statusDot.className = `dot ${state}`;
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  if (label) button.textContent = label;
}

function showError(error) {
  console.error(error);
  setStatus(`Error: ${error.message || error}`, "error");
}

async function startCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera/microphone access requires HTTPS or localhost.");
    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      elements.localVideo.srcObject = localStream;
    }
    elements.start.textContent = "Camera & microphone ready";
    elements.start.disabled = true;
    elements.createOffer.disabled = false;
    setStatus("Camera and microphone ready", "ready");
  } catch (error) { showError(error); }
}

function makePeerConnection() {
  if (peerConnection) return peerConnection;
  if (!localStream) throw new Error("Start camera and microphone first.");
  peerConnection = new RTCPeerConnection(rtcConfig);
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
  peerConnection.ontrack = ({ streams }) => { elements.remoteVideo.srcObject = streams[0]; };
  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    setStatus(`Connection: ${state}`, state === "connected" ? "connected" : state === "failed" ? "error" : "working");
  };
  peerConnection.onicegatheringstatechange = () => {
    if (peerConnection.iceGatheringState === "gathering") setStatus("Gathering local network candidates…", "working");
  };
  elements.disconnect.disabled = false;
  return peerConnection;
}

function waitForIceGatheringComplete(pc) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", done);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", done);
  });
}

function parseDescription(text, expectedType) {
  let description;
  try { description = JSON.parse(text.trim()); } catch { throw new Error("That is not valid offer/answer JSON."); }
  if (!description?.type || !description?.sdp || description.type !== expectedType) throw new Error(`Paste a valid ${expectedType}.`);
  return description;
}

async function createOffer() {
  try {
    const pc = makePeerConnection();
    setBusy(elements.createOffer, true, "Creating offer…");
    await pc.setLocalDescription(await pc.createOffer());
    await waitForIceGatheringComplete(pc);
    elements.localOffer.value = JSON.stringify(pc.localDescription);
    setStatus("Offer ready — send it to your friend", "ready");
  } catch (error) { showError(error); }
  finally { setBusy(elements.createOffer, false, "2. Create offer"); }
}

async function createAnswer() {
  try {
    if (!localStream) await startCamera();
    const pc = makePeerConnection();
    setBusy(elements.createAnswer, true, "Creating answer…");
    await pc.setRemoteDescription(parseDescription(elements.remoteOffer.value, "offer"));
    await pc.setLocalDescription(await pc.createAnswer());
    await waitForIceGatheringComplete(pc);
    elements.localAnswer.value = JSON.stringify(pc.localDescription);
    setStatus("Answer ready — send it to the caller", "ready");
  } catch (error) { showError(error); }
  finally { setBusy(elements.createAnswer, false, "Accept offer & create answer"); }
}

async function acceptAnswer() {
  try {
    if (!peerConnection || peerConnection.signalingState !== "have-local-offer") throw new Error("Create an offer in this tab first.");
    await peerConnection.setRemoteDescription(parseDescription(elements.remoteAnswer.value, "answer"));
    setStatus("Answer accepted — connecting…", "working");
  } catch (error) { showError(error); }
}

function disconnect() {
  if (peerConnection) { peerConnection.close(); peerConnection = undefined; }
  if (localStream) { localStream.getTracks().forEach((track) => track.stop()); localStream = undefined; }
  elements.localVideo.srcObject = null;
  elements.remoteVideo.srcObject = null;
  elements.start.disabled = false;
  elements.start.textContent = "1. Start camera & microphone";
  elements.createOffer.disabled = true;
  elements.disconnect.disabled = true;
  setStatus("Disconnected", "idle");
}

async function copyText(id) {
  const value = $(id).value;
  if (!value) return showError(new Error("Nothing to copy yet."));
  try { await navigator.clipboard.writeText(value); setStatus("Copied to clipboard", "ready"); }
  catch { $(id).select(); document.execCommand("copy"); setStatus("Copied to clipboard", "ready"); }
}

elements.start.addEventListener("click", startCamera);
elements.createOffer.addEventListener("click", createOffer);
elements.createAnswer.addEventListener("click", createAnswer);
elements.acceptAnswer.addEventListener("click", acceptAnswer);
elements.disconnect.addEventListener("click", disconnect);
document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", () => copyText(button.dataset.copy)));
window.addEventListener("beforeunload", disconnect);
