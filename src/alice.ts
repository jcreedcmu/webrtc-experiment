type Global = {
  peer?: RTCPeerConnection,
  channel?: RTCDataChannel,
}
type Invite = {
  cand?: RTCIceCandidate,
  offer?: RTCSessionDescriptionInit,
};

function carp(msg: string) { return (e: Event) => console.log('error', msg, e); }

type Cmd =
  | { t: 'added', id: string }
  | { t: 'response', payload: RTCSessionDescriptionInit };

class Alice {
  invite: Invite = {};
  glob: Global = {};
  proto = location.protocol.replace(/http/g, 'ws');
  ws = new WebSocket(this.proto + "//" + location.host + "/ws");

  maybeGenerateInvite() {
    const { ws, invite } = this;
    if (invite.offer && invite.cand) {
      ws.send(JSON.stringify({ t: "put", payload: invite }));
    }
  }

  aliceStage1(): void {
    const { ws, invite, glob } = this;
    delete localStorage.offer;
    delete localStorage.alice;

    ws.onmessage = (msg) => {
      console.log(msg);
      const cmd: Cmd = JSON.parse(msg.data);
      switch (cmd.t) {
        case 'added':
          const url = '/action/accept?id=' + cmd.id;
          $("#invite")[0].innerHTML = `<a href="${url}" target="_blank">Invite Link</a>`
          break;
        case 'response':
          this.aliceStage2(cmd.payload);
          break;
        default:
          console.error(msg);
      }
    };

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
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE CAND!', event.candidate);
        if (invite.cand == undefined) {
          invite.cand = event.candidate;
          this.maybeGenerateInvite();
        }
      }
    };
    peer.createOffer()
      .then(s => {
        peer.setLocalDescription(s);
        invite.offer = s;
        this.maybeGenerateInvite();
      })
      .catch(e => console.log(e));
  }

  aliceStage2(answer: RTCSessionDescriptionInit) {
    const { glob } = this;
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

  chatLine(e: Event) {
    const { glob } = this;
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
}

function addLine(s: string) {
  ($("#chat")[0] as HTMLInputElement).value += "\n" + s;
}

const g = window as any;
g.Alice = Alice;
export = {};
