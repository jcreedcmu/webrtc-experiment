type Tokens = {
  cand: RTCIceCandidate,
  sessionInit: RTCSessionDescriptionInit,
};

type Bundle = {
  peer: RTCPeerConnection,
  tokens: Tokens,
}

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

async function getOffer(): Promise<Bundle & { channel: RTCDataChannel }> {
  const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

  const channel = peer.createDataChannel('mychannel');
  initDataChannel(channel);
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const cand = await getFirstIceCandidate(peer);

  return { peer, tokens: { cand, sessionInit: offer }, channel };
}

async function useOffer(tokens: Tokens): Promise<Bundle> {
  const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
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

/////

const G: any = window;

G.step1 = () => {
  (async () => {
    const { peer, tokens: offer, channel } = await getOffer();
    console.log(`Run this in another window:
step2(${JSON.stringify(offer)})`);
    G.peer = peer;
    G.channel = channel;
  })();
}

G.step2 = (invite: Tokens) => {
  (async () => {
    const { peer, tokens: answer } = await useOffer(invite);
    console.log(`Run this in original window:
step3(${JSON.stringify(answer)})`);
    const channel = await getDataChannel(peer);
    initDataChannel(channel);
    console.log('opened data channel');
    G.channel = channel;
  })();
}

G.step3 = (answer: Tokens) => {
  (async () => {
    const channel = await useAnswer({ peer: G.peer, tokens: answer });
    console.log('opened data channel');
  })();
}
