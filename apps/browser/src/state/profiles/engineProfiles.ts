import type { BrowserState } from "../browser/store";
import { engineProfile, isIncognitoProfile } from "../browser/model";

export const engineProfiles = (s: Pick<BrowserState, "profiles">) =>
  [...new Set(Object.keys(s.profiles).filter((id) => !isIncognitoProfile(id)).map((id) => engineProfile(s, id)))];

export const profilesUsing = (s: Pick<BrowserState, "profiles">, engine: string) =>
  Object.keys(s.profiles).filter((id) => !isIncognitoProfile(id) && engineProfile(s, id) === engine);
