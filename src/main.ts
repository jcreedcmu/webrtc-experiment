import { render } from './ui';
import { Principal, Invite } from './principal';

function aliceEntryPoint() {
  const p = new Principal();
  render(p);
}

function bobEntryPoint(invite: Invite, id: string) {
  const p = new Principal();
  p.bobStage1({ invite, id });
  render(p);
}

(window as any)['Main'] = { aliceEntryPoint, bobEntryPoint };
