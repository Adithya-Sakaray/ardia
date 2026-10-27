import { create } from "zustand";

export const LIGHTS_CENTER: readonly [number, number] = [25, 27];
export const ARC_LIGHTS_CENTER: readonly [number, number] = [25, 24];
export const TOP_STRIP_LIGHTS_CENTER: readonly [number, number] = [20.75, 20.75];

export const LIGHTS_BAR = { height: 34, lights: [18, 17] as const } as const;

export function lightsBarCenter(shown: number): [number, number] {
  const [x, y] = LIGHTS_BAR.lights;
  return [x, Math.round((y - LIGHTS_BAR.height * (1 - shown)) * 2) / 2];
}

export function lightsCenter(offset: number, down = 0, base: readonly [number, number] = LIGHTS_CENTER): [number, number] | null {
  const dx = Math.round(offset * 2) / 2;
  return dx === 0 && down === 0 && base === LIGHTS_CENTER ? null : [base[0] - dx, base[1] + down];
}

export type PeekSpan = { from: number; to: number };
type DockMotion = { moving: Record<string, true>; peeks: Record<string, PeekSpan> };
export const useDockMotion = create<DockMotion>()(() => ({ moving: {}, peeks: {} }));

export const dockMoving = (windowId: string) => !!useDockMotion.getState().moving[windowId];

export const whenDockStill = (windowId: string, listener: () => void) =>
  useDockMotion.subscribe((m) => {
    if (!m.moving[windowId]) listener();
  });

export function setDockMoving(windowId: string, moving: boolean) {
  const current = useDockMotion.getState().moving;
  if (!!current[windowId] === moving) return;
  const { [windowId]: _, ...rest } = current;
  useDockMotion.setState({
    moving: moving ? { ...current, [windowId]: true } : rest,
  });
}

export function setPeekShown(windowId: string, shown: boolean, from = -Infinity, to = 0) {
  const current = useDockMotion.getState().peeks;
  const was = current[windowId];
  if (shown ? was?.from === from && was.to === to : !was) return;
  const { [windowId]: _, ...rest } = current;
  useDockMotion.setState({ peeks: shown ? { ...current, [windowId]: { from, to } } : rest });
}
export const peekShown = (windowId: string) => windowId in useDockMotion.getState().peeks;
export const overPeek = (windowId: string, x: number) => {
  const span = useDockMotion.getState().peeks[windowId];
  return !!span && x >= span.from && x < span.to;
};
export const usePeekSpan = (windowId: string): PeekSpan | undefined => useDockMotion((m) => m.peeks[windowId]);
export const devPeeks: Record<string, { show(): void; hide(): void }> = {};
