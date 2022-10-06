type Global = {
  peer?: RTCPeerConnection,
  channel?: RTCDataChannel,
}

export type Invite = {
  cand?: RTCIceCandidate,
  offer?: RTCSessionDescriptionInit,
};

function carp(msg: string) { return (e: Event) => console.log('error', msg, e); }

type Cmd =
  | { t: 'added', id: string }
  | { t: 'response', payload: RTCSessionDescriptionInit };

export class Principal {

  connectTime: number = null;
  invite: Invite = {};
  glob: Global = {};
  proto = location.protocol.replace(/http/g, 'ws');
  ws = new WebSocket(this.proto + "//" + location.host + "/ws");
  channelDataCb: (s: string) => void = (s) => { };

  maybeGenerateInvite() {
    const { ws, invite } = this;
    if (invite.offer && invite.cand) {
      console.log("alice sending invite along websocket");
      ws.send(JSON.stringify({ t: "put", payload: invite }));
    }
  }

  aliceStage1(linkCb: (url: string) => void): void {
    const { ws, invite, glob } = this;
    delete localStorage.offer;
    delete localStorage.alice;

    ws.onmessage = (msg) => {
      console.log(msg);
      const cmd: Cmd = JSON.parse(msg.data);
      switch (cmd.t) {
        case 'added':
          linkCb('/action/accept?id=' + cmd.id);
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
    peer.oniceconnectionstatechange = (e) => { console.log(e.type, peer.iceConnectionState, Date.now() - this.connectTime); };
    peer.onsignalingstatechange = (e) => { console.log(e.type, peer.signalingState); };
    channel.onclose = (e) => { console.log('channel close', e); };

    channel.onopen = () => console.log('open');
    channel.onclose = () => console.log('close');
    channel.onerror = carp('generic');
    channel.onmessage = (e) => {
      console.log('got message ', e);
      this.channelDataCb(e.data);
    }
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('alice stage 1 ICE CAND!', event.candidate);
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
    console.log('alice stage 2 happening');
    this.connectTime = Date.now();
    const { glob } = this;
    const peer = glob.peer;
    if (peer != undefined) {
      peer.setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => { console.log('succ'); })
        .catch(carp('setRemoteDescription'));

      var cand = JSON.parse(localStorage['bob']);
      console.log(`alice stage 2: cand is ${JSON.stringify(cand)}`);
      peer.addIceCandidate(cand)
        .then(() => console.log("ice succ"))
        .catch((e) => console.error("ice fail", e));
    }
    else {
      console.error("peer is undefined in aliceStage2 and should not be");
    }
  }

  bobStage1(bobData: { invite: Invite, id: string }) {
    delete localStorage.bob;

    const { invite: { offer, cand }, id } = bobData;
    const { glob, proto } = this;
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
      channel.onmessage = (e) => this.channelDataCb(e.data);
    }

    peer.onicecandidate = function(event) {
      if (event.candidate) {
        console.log('bob stage 1 ICE CAND!', event.candidate);
        if (localStorage.bob == undefined) {
          console.log('bob stage 1 storing', JSON.stringify(event.candidate));
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
          console.log('bob sending response along websocket');
          ws.send(JSON.stringify({ t: "respond", id, payload: answer }));
        };
        peer.setLocalDescription(answer);
      })
      .catch(carp('createAnswer'));

    console.log(`bob stage 1: cand is ${JSON.stringify(cand)}`);
    peer.addIceCandidate(cand)
      .then(() => console.log("ice succ"))
      .catch((e) => console.error("ice fail", e));
  }
}
