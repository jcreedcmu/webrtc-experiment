import { render } from './ui';
import { Principal, Invite } from './principal';

export function aliceEntryPoint() {
  const p = new Principal();
  render(p);
}

export function bobEntryPoint(invite: Invite, id: string) {
  const p = new Principal();
  p.bobStage1({ invite, id });
  render(p);
}
