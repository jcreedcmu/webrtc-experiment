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

class Principal {
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

    // Some probes into connection changes
    peer.onconnectionstatechange = (e) => { console.log(e.type, peer.connectionState); };
    peer.oniceconnectionstatechange = (e) => { console.log(e.type, peer.iceConnectionState); };
    peer.onsignalingstatechange = (e) => { console.log(e.type, peer.signalingState); };
    channel.onclose = (e) => { console.log('channel close', e); };

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

  bobStage1(invite: Invite, id: string) {
    const { glob, proto } = this;
    const { offer, cand } = invite;
    if (offer == undefined || cand == undefined) {
      throw "malformed invite";
    }

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
