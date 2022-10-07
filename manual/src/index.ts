import { Tokens, Bundle } from './types';

async function getFirstIceCandidate(peer: RTCPeerConnection): Promise<RTCIceCandidate> {
  return new Promise((res, rej) => {
    peer.onicecandidate = event => {
      if (event.candidate) {
        res(event.candidate);
      }
    };
  });
}

function initDataChannel(ch: RTCDataChannel): void {
  ch.onopen = () => console.log('open');
  ch.onclose = () => console.log('close');
  ch.onerror = e => console.log('error', e);
  ch.onmessage = (e: any) => console.log('message', e);
}

async function getDataChannel(peer: RTCPeerConnection): Promise<RTCDataChannel> {
  return new Promise((res, rej) => {
    peer.ondatachannel = event => {
      res(event.channel);
    };
  });
}

//////

function createChannel(peer: RTCPeerConnection): RTCDataChannel {
  const channel = peer.createDataChannel('mychannel');
  initDataChannel(channel);
  return channel;
}

function createPeer(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
}

async function getOffer(peer: RTCPeerConnection): Promise<Tokens> {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const cand = await getFirstIceCandidate(peer);
  return { cand, sessionInit: offer };
}

async function useOffer(tokens: Tokens): Promise<Bundle> {
  const peer = createPeer();
  await peer.setRemoteDescription(new RTCSessionDescription(tokens.sessionInit));
  const answer = await peer.createAnswer();
  peer.setLocalDescription(answer);
  const cand = await getFirstIceCandidate(peer);
  return { peer, tokens: { cand, sessionInit: answer } };
}

async function useAnswer(bundle: Bundle): Promise<void> {
  const { peer, tokens } = bundle;
  await peer.setRemoteDescription(new RTCSessionDescription(tokens.sessionInit));
  await peer.addIceCandidate(tokens.cand);
}

function broadcastOffer(id: string, offer: Tokens): Promise<Tokens> {
  console.log(`Run this in another window:
step2(${JSON.stringify(offer)})`);
  return new Promise((res, rej) => {
    G.step3 = (answer: Tokens) => res(answer);
  });
}

function signalAnswer(id: string, answer: Tokens): void {
  console.log(`Run this in original window:
step3(${JSON.stringify(answer)})`);
}

/////

const G: any = window;

G.step1 = () => {
  (async () => {
    const peer = createPeer();
    const channel = createChannel(peer);
    const offer = await getOffer(peer);
    const answerPromise = broadcastOffer('alice', offer);
    const answer = await answerPromise;
    useAnswer({ peer, tokens: answer });
    console.log('opened data channel!');
    G.channel = channel;
  })();
}

G.step2 = (invite: Tokens) => {
  (async () => {
    const { peer, tokens: answer } = await useOffer(invite);
    signalAnswer('alice', answer);
    const channel = await getDataChannel(peer);
    initDataChannel(channel);
    console.log('opened data channel!');
    G.channel = channel;
  })();
}
