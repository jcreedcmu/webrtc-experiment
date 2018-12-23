type Global = {
  peer?: RTCPeerConnection,
  channel?: RTCDataChannel,
}
type Invite = {
  cand: RTCIceCandidate,
  offer: RTCSessionDescriptionInit,
};

declare const invite: Invite;
declare const id: string;

const glob: Global = {};
const proto = location.protocol.replace(/http/g, 'ws');

acceptOffer(invite);

function carp(msg: string) { return (e: Event) => console.log('error', msg, e); }

function acceptOffer(invite: Invite) {
  const offer = invite.offer;
  const cand = invite.cand;

  const peer = glob.peer = new RTCPeerConnection({
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302'] }]
  });

  peer.ondatachannel = (ch) => {
    const channel = ch.channel;
    glob.channel = channel;
    channel.onopen = () => console.log('open');
    channel.onclose = () => console.log('close');
    channel.onerror = (e) => console.log('error', e);
    channel.onmessage = (e) => addLine(e.data);
  }

  peer.onicecandidate = function(event) {
    if (event.candidate) {
      console.log('ICE CAND!', event.candidate);
      if (localStorage.bob == undefined) {
        localStorage.bob = JSON.stringify(event.candidate);
      }
    }
  };

  peer.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => { console.log('succ'); })
    .catch(carp('setRemoteDescription'));

  peer.createAnswer()
    .then((answer) => {
      console.log('answered');
      const ws = new WebSocket(proto + "//" + location.host + "/ws");
      ws.onopen = () => {
        ws.send(JSON.stringify({ t: "respond", id, payload: answer }));
      };
      peer.setLocalDescription(answer);
    })
    .catch(carp('createAnswer'));

  peer.addIceCandidate(cand)
    .then(() => console.log("ice succ"))
    .catch((e) => console.error("ice fail", e));
}

function addLine(s: string) {
  ($("#chat")[0] as HTMLInputElement).value += "\n" + s;
}

function chatLine(e: Event) {
  e.stopPropagation();
  e.preventDefault();
  const lineElm = $("#line")[0] as HTMLInputElement;
  const line = lineElm.value;
  lineElm.value = '';
  if (glob.channel != undefined) {
    glob.channel.send(line);
  }
  addLine(line);
}

const g = window as any;
g.chatLine = chatLine;
export = {};
