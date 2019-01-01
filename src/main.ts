import { render } from './ui';
import { Principal, Invite } from './principal';

export function aliceEntryPoint() {
  const p = new Principal({ t: "alice" });
  render(p);
}

export function bobEntryPoint(invite: Invite, id: string) {
  const p = new Principal({ t: "bob", invite, id });
  render(p);
}
