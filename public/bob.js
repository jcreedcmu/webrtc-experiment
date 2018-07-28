// bob

const global = {};

function carp(msg) { return (e) => console.log('error', msg, e); }

function acceptOffer() {
  const invite = JSON.parse($("#fromalice")[0].value);
  const offer = invite.offer;
  const cand = invite.cand;

  const peer = global.peer = new RTCPeerConnection({iceServers: [{url: 'stun:stun.l.google.com:19302'}]}, {});

  peer.ondatachannel = (ch) => {
	 const channel = ch.channel;
	 global.channel = channel;
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
  }, carp('setRemoteDescription'));

  peer.createAnswer((answer) => {
	 console.log('answered');
	 $("#toalice")[0].value = JSON.stringify(answer);
	 peer.setLocalDescription(answer);
  }, carp('createAnswer'));

  peer.addIceCandidate(cand)
	 .then(() => console.log("ice succ"))
	 .catch((e) => console.error("ice fail", e));
}
