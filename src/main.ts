import { render } from './ui';
import { Principal } from './principal';


export function aliceEntryPoint() {
  const p = new Principal();
  render(p);
}
