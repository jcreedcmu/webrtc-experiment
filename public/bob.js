// bob

const global = {};

acceptOffer(invite);

function carp(msg) { return (e) => console.log('error', msg, e); }

//  const invite = JSON.parse($("#fromalice")[0].value);

function acceptOffer(invite) {
  const offer = invite.offer;
  const cand = invite.cand;

  const peer = global.peer = new RTCPeerConnection({iceServers: [{url: 'stun:stun.l.google.com:19302'}]}, {});

  peer.ondatachannel = (ch) => {
	 const channel = ch.channel;
	 global.channel = channel;
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

  peer.setRemoteDescription(new RTCSessionDescription(offer), () => {
	 console.log('succ');
  }, carp('setRemoteDescription'));

  peer.createAnswer((answer) => {
	 console.log('answered');
	 const ws = new WebSocket("ws://" + location.hostname + ":8080");
	 ws.onopen = () => {
		ws.send(JSON.stringify({t: "respond", id, payload: answer}));
	 };
	 peer.setLocalDescription(answer);
  }, carp('createAnswer'));

  peer.addIceCandidate(cand)
	 .then(() => console.log("ice succ"))
	 .catch((e) => console.error("ice fail", e));
}

function addLine(s) {
  $("#chat")[0].value += "\n" + s;
}

function chatLine(e) {
  e.stopPropagation();
  e.preventDefault();
  const line = $("#line")[0].value;
  $("#line")[0].value = '';
  global.channel.send(line);
  addLine(line);
}
