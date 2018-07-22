
function aliceStage1() {
  delete localStorage.offer;
  delete localStorage.alice;
  var peer = new RTCPeerConnection({iceServers: [{url: 'stun:stun.l.google.com:19302'}]}, {});
  var channel = peer.createDataChannel('sctp-channel', {});
  function eh(msg) { return (e) => console.log('error', msg, e); }

  channel.onopen = () => console.log('open');
  channel.onclose = () => console.log('close');
  channel.onerror = eh('generic');
  channel.onmessage = (e) => console.log('message', e);
  peer.onicecandidate = function(event) {
	 if (event.candidate) {
		console.log('ICE CAND!', event.candidate);
		if (localStorage.alice == undefined) {
		  localStorage.alice = JSON.stringify(event.candidate);
		}
	 }
  };
  peer.createOffer(
	 (s) => {
		peer.setLocalDescription(s);
		const offer = JSON.stringify({offer: s});
		console.log('raw offer: ', offer);
		fetch('/action/add', {headers: {
        "Content-Type": "application/json; charset=utf-8"
		}, method: 'POST', body: offer})
		  .then(x => x.json()).then(response => display(response))
		  .catch(e => console.error(e));

	 },
	 (e) => console.log(e),
	 {}
  );
}

function display(response) {
  const url = '/action/accept?' + response.added;
  document.getElementById('invite').innerHTML =
	 `<a href="${url}">invite</a>`;
}

function aliceStage2() {
  var answer = JSON.parse(localStorage['answer']);
  peer.setRemoteDescription(new RTCSessionDescription(answer), () => {
	 console.log('succ');
  }, eh('setRemoteDescription'));

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
