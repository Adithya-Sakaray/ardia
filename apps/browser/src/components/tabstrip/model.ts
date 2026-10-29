import type { Animated } from "react-native";
import type { DropSpot } from "../../state/drag/drops";
import { dropTabsAt, dropTabsInSlot, useStripOntoIs, type StripMember } from "../../state/tabs/topStrip";
import type { DragGeometry } from "./stripGroups";
import { PINNED_CELL, PINNED_SPACING } from "./tokens";

export type DropTarget = { kind: "tab" | "group"; id: string };

export const ontoKey = (target: DropTarget | null) => (target ? `${target.kind}:${target.id}` : null);
export const useOnto = (target: DropTarget) => useStripOntoIs(ontoKey(target));

export const chipKey = (groupId: string) => `strip-group-chip|${groupId}`;
export const folderKey = (groupId: string) => `strip-folder-chip|${groupId}`;
export const holds = (m: StripMember, tabId: string) => (m.kind === "tab" ? m.id === tabId : m.tabIds.includes(tabId));
export const tabsOf = (m: StripMember) => (m.kind === "tab" ? [m.id] : m.tabIds);
export const units = (m: StripMember, activeId: string) => (m.kind === "split" ? Math.min(m.tabIds.length, 2) : m.kind === "folder" ? (holds(m, activeId) ? 1 : 0) : 1);

export type StripDrag = {
  tabId: string | null;
  ids: () => string[];
  pinned: boolean;
  groupId: string | null;
  geometry: DragGeometry;
  from: number;
  width: number;
  gap: number;
  axis?: "x" | "y";
  range?: [number, number] | ((grab: number) => [number, number]);
  drop?: (dx: number, ids: string[]) => boolean;
  cross?: Cross;
  targets?: (DropTarget | null)[];
  levels?: number;
  local?: boolean;
};

export type Landing = { dx: number; commit: () => void };
export type Cross = { at: (dx: number, grab: number) => boolean; land: (dx: number, grab: number, ids: string[]) => Landing | null; clear: () => void };

export type Dock = { ids: string[]; left: number; geometry: DragGeometry };
export type Strip = { dock: Dock | null; top: DragGeometry; targets: (DropTarget | null)[]; chip: number; grow: Animated.Value };
export const CELL_STEP = PINNED_CELL + PINNED_SPACING;
export const dockWidth = (cells: number) => cells * CELL_STEP - PINNED_SPACING;

export function reorder(ids: string[], { geometry, from, pinned, groupId }: StripDrag, to: number): boolean {
  return dropTabsInSlot(ids, geometry.slots, from, to, { pinned, groupId });
}

export function dropAt(ids: string[], spot: DropSpot): boolean {
  return dropTabsAt(ids, { kind: "tab" }, spot);
}

export const dropOnto = (target: DropTarget, ids: string[]) =>
  dropAt(ids, target.kind === "tab" ? { zone: "onto", targetId: target.id } : { zone: "group", groupId: target.id, beforeId: null });

export type GroupOut = { top: DragGeometry; slot: number; chip: number; expanded: boolean; left: number };
