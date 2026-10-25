import { WindowBackdrop } from "@ardia/shaders";
import { LightsBarClip, setTrafficLightsCenter, WindowDragRegion } from "@ardia/shell";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { layout, useTheme } from "../../lib/theme";
import { LIGHTS_BAR, lightsBarCenter } from "./dockMotion";

const EASE = Easing.inOut(Easing.sin);

export type LightsBar = { shown: Animated.Value; open: boolean; drawn: boolean; show(): void; hide(): void };

export function useLightsBar(windowId: string, enabled: boolean): LightsBar {
  const shown = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const opened = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const place = useRef<((value: number) => void) | null>(null);
  const listener = useRef<string | undefined>(undefined);
  const follow = () => {
    if (listener.current !== undefined) shown.removeListener(listener.current);
    const to = place.current;
    listener.current = to ? shown.addListener(({ value }) => to(value)) : undefined;
  };
  const slide = (to: 0 | 1) => {
    follow();
    opened.current = to === 1;
    setOpen(to === 1);
    if (to === 1) setDrawn(true);
    Animated.timing(shown, { toValue: to, duration: LIGHTS_BAR.ms, easing: EASE, useNativeDriver: false }).start(
      ({ finished }) => finished && to === 0 && setDrawn(false),
    );
  };
  const show = () => {
    clearTimeout(hideTimer.current);
    if (enabled && !opened.current) slide(1);
  };
  const hide = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => opened.current && slide(0), LIGHTS_BAR.hideDelayMs);
  };
  useEffect(() => {
    if (!enabled) return;
    let sent = "";
    place.current = (value: number) => {
      const center = lightsBarCenter(value);
      const key = center.join(",");
      if (key === sent) return;
      sent = key;
      void setTrafficLightsCenter(windowId, center);
    };
    place.current((shown as unknown as { __getValue(): number }).__getValue());
    follow();
    return () => {
      place.current = null;
      follow();
      clearTimeout(hideTimer.current);
      shown.stopAnimation();
      shown.setValue(0);
      opened.current = false;
      setOpen(false);
      setDrawn(false);
      void setTrafficLightsCenter(windowId, null);
    };
  }, [windowId, enabled, shown]);
  useEffect(() => () => clearTimeout(hideTimer.current), []);
  ((globalThis as { __acLights?: Record<string, unknown> }).__acLights ??= {})[windowId] = { show, hide };
  return { shown, open, drawn, show, hide };
}

export function LightsBarZone({ bar, rest, right }: { bar: LightsBar; rest: number; right: Animated.AnimatedInterpolation<number> | number }) {
  return (
    <Animated.View
      onMouseEnter={bar.show}
      onMouseLeave={bar.hide}
      style={{ position: "absolute", left: 0, top: 0, right, height: bar.open ? LIGHTS_BAR.height : rest }}
    >
      <WindowDragRegion style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const AnimatedClip = Animated.createAnimatedComponent(LightsBarClip);

export function LightsBarCover({
  bar,
  right,
  window,
  inset,
}: {
  bar: LightsBar;
  right: Animated.AnimatedInterpolation<number> | number;
  window: { width: number; height: number };
  inset: { top: number; left: number };
}) {
  const theme = useTheme();
  const height = useMemo(
    () => bar.shown.interpolate({ inputRange: [0, 1], outputRange: [inset.top + layout.cardRadius, LIGHTS_BAR.height + layout.cardRadius] }),
    [bar.shown, inset.top],
  );
  if (!bar.drawn || !window.width || (globalThis as { __acNoCover?: boolean }).__acNoCover) return null;
  return (
    <AnimatedClip pointerEvents="none" holeLeft={inset.left} holeRadius={layout.cardRadius} style={{ position: "absolute", left: 0, top: 0, right, height }}>
      <WindowBackdrop
        vibrancy
        {...theme.backdrop}
        colors={theme.windowTint}
        grainOpacity={theme.grain}
        style={{ position: "absolute", left: 0, top: 0, width: window.width, height: window.height }}
      />
    </AnimatedClip>
  );
}
