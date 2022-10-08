type Double<T, U> = {
  vals: ((v: U) => T)[],
  covs: ((v: T) => U)[],
};

export type Channel<T> = Double<T, null>;

export function channel<T, U>(): Double<T, U> {
  return { vals: [], covs: [] };
}

export async function send<T, U>(ch: Double<T, U>, msg: T): Promise<U> {
  const cov = ch.covs.shift();
  return cov ? cov(msg) :
    new Promise<U>((res, rej) => ch.vals.push(u => { res(u); return msg; }));
}

// receive is a special case of send
export function recv<T>(ch: Channel<T>): Promise<T> {
  return send<null, T>({ vals: ch.covs, covs: ch.vals }, null);
}

// A table of auto-vivifying channels.
//
// FIXME: maybe should handle garbage collection somehow.

export type DoubleTable<T, U> = Record<string, Double<T, U>>;
export type ChannelTable<T> = Record<string, Channel<T>>;

export function makeTable<T, U = null>(): DoubleTable<T, U> {
  return {}
};

export function tableSend<T, U>(table: DoubleTable<T, U>, key: string, value: T): Promise<U> {
  if (table[key] == undefined) {
    table[key] = channel();
  }
  return send(table[key], value);
}

export function tableRecv<T>(table: ChannelTable<T>, key: string): Promise<T> {
  if (table[key] == undefined) {
    table[key] = channel();
  }
  return recv(table[key]);
}
