
let invite = {};

function maybeGenerateInvite() {
  console.log(">", JSON.stringify(invite));
  if (invite.offer && invite.cand) {
	 fetch('/action/add', {headers: {
      "Content-Type": "application/json; charset=utf-8"
	 }, method: 'POST', body: JSON.stringify(invite)})
		.then(x => x.json()).then(response => display(response))
		.catch(e => console.error(e));
  }
}

function aliceStage1() {
  delete localStorage.offer;
  delete localStorage.alice;
  var peer = new RTCPeerConnection({iceServers: [{url: 'stun:stun.l.google.com:19302'}]}, {});
  var channel = peer.createDataChannel('sctp-channel', {});
  function carp(msg) { return (e) => console.log('error', msg, e); }

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

function aliceStage2() {
  var answer = JSON.parse(localStorage['answer']);
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
