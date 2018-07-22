// bob

delete localStorage.answer;
delete localStorage.bob;

var offer = JSON.parse(localStorage['offer']);
var cand = JSON.parse(localStorage['alice']);

var peer = new RTCPeerConnection({iceServers: [{url: 'stun:stun.l.google.com:19302'}]}, {});
var channel;
function eh(msg) { return (e) => console.log('error', msg, e); }

peer.ondatachannel = (ch) => {
  channel = ch.channel;
  channel.onopen = () => console.log('open');
  channel.onclose = () => console.log('close');
  channel.onerror = (e) => console.log('error', e);
  channel.onmessage = (e) => console.log('message', e);
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
}, eh('setRemoteDescription'));

peer.createAnswer((answer) => {
  console.log('answered');
  localStorage['answer'] = JSON.stringify(answer);
  peer.setLocalDescription(answer);
}, eh('createAnswer'));

peer.addIceCandidate(cand)
  .then(() => console.log("ice succ"))
  .catch((e) => console.error("ice fail", e));
