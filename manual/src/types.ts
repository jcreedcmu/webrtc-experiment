export type Tokens = {
  cand: RTCIceCandidate,
  sessionInit: RTCSessionDescriptionInit,
};

export type Bundle = {
  peer: RTCPeerConnection,
  tokens: Tokens,
}

export type PiChannel<T> = {
  read(): Promise<T>
}

export type TransportLayer<O, L, C> = {
  listen(id: string, offer: O): Promise<PiChannel<L>>,
  connect(id: string): Promise<PiChannel<C>>,
}
