// import { Tokens, TransportLayer, PiChannel } from './types';

// function manualTransportLayer(manualResolverName: string): TransportLayer<Tokens, Tokens, void> {
//   async function listen(id: string, offer: Tokens) {
//     const p = new Promise<string>((res, rej) => {
//       (window as any)[manualResolverName] = value => res(value);
//     });
//     const channel: PiChannel<string> = {
//       async read() { return await p; }
//     };
//     console.log(`offer is ${JSON.stringify(offer)}, to resolve promise, call window.${manualResolverName}`);
//     return channel;
//   }
//   async function connect(id): Promise<PiChannel<void>> {
//     return { async read() { } }
//   }
//   return { listen, connect };
// }
