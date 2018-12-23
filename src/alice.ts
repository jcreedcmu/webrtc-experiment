type Global = {
  peer?: RTCPeerConnection,
  channel?: RTCDataChannel,
}
type Invite = {
  cand?: RTCIceCandidate,
  offer?: RTCSessionDescriptionInit,
};
const invite: Invite = {};
const glob: Global = {};

function carp(msg: string) { return (e: Event) => console.log('error', msg, e); }

const proto = location.protocol.replace(/http/g, 'ws');
const ws = new WebSocket(proto + "//" + location.host + "/ws");
function maybeGenerateInvite() {
  if (invite.offer && invite.cand) {
    ws.send(JSON.stringify({ t: "put", payload: invite }));
  }
}

type Cmd =
  | { t: 'added', id: string }
  | { t: 'response', payload: RTCSessionDescriptionInit };

ws.onmessage = (msg) => {
  console.log(msg);
  const cmd: Cmd = JSON.parse(msg.data);
  switch (cmd.t) {
    case 'added':
      const url = '/action/accept?id=' + cmd.id;
      $("#invite")[0].innerHTML = `<a href="${url}">Invite Link</a>`
      break;
    case 'response':
      aliceStage2(cmd.payload);
      break;
    default:
      console.error(msg);
  }
};

function aliceStage1(): void {
  delete localStorage.offer;
  delete localStorage.alice;

  glob.peer = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] });
  const peer = glob.peer;
  glob.channel = peer.createDataChannel('sctp-channel', {});
  const channel = glob.channel;

  channel.onopen = () => console.log('open');
  channel.onclose = () => console.log('close');
  channel.onerror = carp('generic');
  channel.onmessage = (e) => {
    console.log('got message ', e);
    addLine(e.data);
  }
  peer.onicecandidate = function(event) {
    if (event.candidate) {
      console.log('ICE CAND!', event.candidate);
      if (invite.cand == undefined) {
        invite.cand = event.candidate;
        maybeGenerateInvite();
      }
    }
  };
  peer.createOffer()
    .then(s => {
      peer.setLocalDescription(s);
      invite.offer = s;
      maybeGenerateInvite();
    })
    .catch(e => console.log(e));
}

function aliceStage2(answer: RTCSessionDescriptionInit) {
  const peer = glob.peer;
  if (peer != undefined) {
    peer.setRemoteDescription(new RTCSessionDescription(answer))
      .then(() => { console.log('succ'); })
      .catch(carp('setRemoteDescription'));

    var cand = JSON.parse(localStorage['bob']);
    peer.addIceCandidate(cand)
      .then(() => console.log("ice succ"))
      .catch((e) => console.error("ice fail", e));
  }
  else {
    console.error("peer is undefined in aliceStage2 and should not be");
  }
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
