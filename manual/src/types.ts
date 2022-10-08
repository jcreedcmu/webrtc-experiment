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

export type SignalKV<T> = {
  put(key: string, value: T): Promise<void>,
  get(key: string): Promise<T>,
}

export type Network = {
  listen: (id: string) => Promise<RTCDataChannel>;
  connect: (id: string) => Promise<RTCDataChannel>;
}
