
const invite = {};
const global = {};

function carp(msg) { return (e) => console.log('error', msg, e); }

const ws = new WebSocket("ws://" + location.hostname + ":8080");
function maybeGenerateInvite() {
  if (invite.offer && invite.cand) {
	 ws.send(JSON.stringify({t: "put", payload: invite}));
  }
}

ws.onmessage = (msg) => {
  console.log(msg);
  const cmd = JSON.parse(msg.data);
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

function aliceStage1() {
  delete localStorage.offer;
  delete localStorage.alice;

  global.peer = new RTCPeerConnection({iceServers: [{url: 'stun:stun.l.google.com:19302'}]}, {});
  const peer = global.peer;
  global.channel = peer.createDataChannel('sctp-channel', {});
  const channel = global.peer;

  channel.onopen = () => console.log('open');
  channel.onclose = () => console.log('close');
  channel.onerror = carp('generic');
  channel.onmessage = (e) => console.log('message', e);
  peer.onicecandidate = function(event) {
	 if (event.candidate) {
		console.log('ICE CAND!', event.candidate);
		if (invite.cand == undefined) {
		  invite.cand = event.candidate;
		  maybeGenerateInvite();
		}
	 }
  };
  peer.createOffer(
	 (s) => {
		peer.setLocalDescription(s);
		invite.offer = s;
		maybeGenerateInvite();
	 },
	 (e) => console.log(e),
	 {}
  );
}

function display(response) {
  const url = '/action/accept?id=' + response.added;
  $('#invite')[0].innerHTML =
	 `<a href="${url}">invite</a>`;
}

function aliceStage2(answer) {
  const peer = global.peer;
//  var answer = JSON.parse($("#frombob")[0].value);
  peer.setRemoteDescription(new RTCSessionDescription(answer), () => {
	 console.log('succ');
  }, carp('setRemoteDescription'));

  var cand = JSON.parse(localStorage['bob']);
  peer.addIceCandidate(cand)
	 .then(() => console.log("ice succ"))
	 .catch((e) => console.error("ice fail", e));
}

// // alice or bob:
// channel.send("hello");


function test() {
  fetch('/action/add', {
	 headers: {
		"Content-Type": "application/json; charset=utf-8"
	 },
	 method: 'POST', body: '{"foo":"bar"}'})
	 .then(x => x.json())
	 .then(j => {window.j = j; console.log('json back from server: ', j)})
	 .catch(x => console.error(x));
}
