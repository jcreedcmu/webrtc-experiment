import { Tokens, SignalKV } from './types';
const G: any = window;

type TableState<T> =
  | undefined
  | { t: 'pendingRead', k: (data: T) => void }
  | { t: 'pendingWrite', v: T };

function _transmit<T>(table: Record<string, TableState<T>>, id: string, data: T): void {
  const entry = table[id];
  if (entry == undefined) {
    table[id] = { t: 'pendingWrite', v: data };
    return;
  }
  switch (entry.t) {
    case 'pendingRead': return entry.k(data);
    case 'pendingWrite': throw 'unexpected double write';
  }
}

const table: Record<string, TableState<Tokens>> = {};

// Install this as global variable so we can easily manually test from console.log
G.transmit = (id: string, data: Tokens) => { _transmit(table, id, data); }

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
  const entry = table[key];
  if (entry == undefined) {
    return new Promise((res, rej) => {
      table[key] = { t: 'pendingRead', k: res };
    });
  }
  switch (entry.t) {
    case 'pendingWrite': return entry.v;
    case 'pendingRead': throw 'unexpected double read';
  }
}

export const kv: SignalKV<Tokens> = { get, put };
