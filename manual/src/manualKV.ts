import { Tokens, SignalKV } from './types';
const G: any = window;

const table: Record<string, (data: Tokens) => void> = {};

function transmit(id: string, data: Tokens): void {
  table[id](data);
}

// Install this as global variable so we can easily manually test from console.log
G.transmit = transmit;

const codeStyle = `
border-radius: 5px;
border: 1px solid black;
padding: 10px;
font-family: iosevka, sans-serif;
font-size: 9px;
margin-right: 50%;
`;

async function put(key: string, value: Tokens): Promise<void> {
  console.log(`You should call:`);
  console.log(`%ctransmit(${JSON.stringify(key)}, ${JSON.stringify(value)});`, codeStyle);
  console.log(`in the other window.`);
}

async function get(key: string): Promise<Tokens> {
  return new Promise((res, rej) => {
    table[key] = res;
  });
}

export const kv: SignalKV<Tokens> = { get, put };
