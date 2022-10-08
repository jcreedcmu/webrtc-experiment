import { Tokens, SignalKV } from './types';
import { default as axios } from 'axios';

async function put(key: string, value: Tokens): Promise<void> {
  const resp = await axios.post('localhost:8001/put', { key, value });
  if (resp.status !== 200) {
    console.error(resp.statusText);
    console.dir(resp);
  }
}

async function get(key: string): Promise<Tokens> {
  const resp = await axios.post('localhost:8001/put', { key });
  console.log(resp.data);
  return JSON.parse(resp.data);
}

export const kv: SignalKV<Tokens> = { get, put };
