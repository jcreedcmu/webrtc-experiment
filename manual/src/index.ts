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

async function useOffer(peer: RTCPeerConnection, tokens: Tokens): Promise<Tokens> {
  await peer.setRemoteDescription(new RTCSessionDescription(tokens.sessionInit));
  const answer = await peer.createAnswer();
  peer.setLocalDescription(answer);
  const cand = await getFirstIceCandidate(peer);
  return { cand, sessionInit: answer };
}

async function useAnswer(bundle: Bundle): Promise<void> {
  const { peer, tokens } = bundle;
  await peer.setRemoteDescription(new RTCSessionDescription(tokens.sessionInit));
  await peer.addIceCandidate(tokens.cand);
}

function fakeWrite(id: string, offer: Tokens): void {
  console.log(`You should call
transmit(${JSON.stringify(id)}, ${JSON.stringify(offer)});
in the other window`);
}

const table: Record<string, (data: Tokens) => void> = {};

function fakeRead(id: string): Promise<Tokens> {
  return new Promise((res, rej) => {
    table[id] = res;
  });
}

function transmit(id: string, data: Tokens): void {
  table[id](data);
}

/////

const G: any = window;
G.transmit = transmit;

G.hlListen = () => {
  (async () => {
    const peer = createPeer();
    const channel = createChannel(peer);
    const offer = await getOffer(peer);
    await fakeWrite('alice.offer', offer);
    const answer = await fakeRead('alice.answer');
    useAnswer({ peer, tokens: answer });
    console.log('opened data channel!');
    G.channel = channel;
  })();
}

G.hlConnect = (invite: Tokens) => {
  (async () => {
    const peer = createPeer();
    const offer = await fakeRead('alice.offer');
    const answer = await useOffer(peer, offer);
    await fakeWrite('alice.answer', answer);
    const channel = await getDataChannel(peer);
    initDataChannel(channel);
    console.log('opened data channel!');
    G.channel = channel;
  })();
}
