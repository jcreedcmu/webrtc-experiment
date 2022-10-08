import { Tokens, Bundle, SignalKV, Network } from './types';
import { kv as manualKV } from './manualKV';
import { networkOfSignalling } from './network-of-signalling';

const G: any = window;

const net = networkOfSignalling(manualKV);

G.step1 = () => {
  (async () => {
    G.channel = await net.listen('channel-id');
  })();
}

G.step2 = () => {
  (async () => {
    G.channel = await net.connect('channel-id');
  })();
}
