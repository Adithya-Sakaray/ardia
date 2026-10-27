import { Surface } from "../ui";
import { hex, layout, useTheme } from "../ui/theme";
import { ink } from "../ui/tokens";
import { clickTab } from "../../state/sidebar/actions";
import { cardHoverProps, dismissHover } from "../../state/sidebar/hover";
import { hoverCardOrigin } from "../sidebar/hoverMotion";
import { useSidebarSide } from "../../state/windows/layout";
import { measureRow, setSidebarUi, type Anchor } from "../../state/sidebar/sidebarUi";
import { useSidebarWidth } from "../sidebar/tokens";
import { MINI_PLAYER_HEIGHT, MINI_PLAYER_WIDTH, MiniPlayer } from "./MiniPlayer";
import { useMedia, usePinnedWithMediaControls } from "../../state/media/media";
import { useMediaTokens } from "./tokens";

export function useShowsMiniPlayer(tabId: string | undefined): boolean {
  const pinned = usePinnedWithMediaControls(tabId);
  const hasSession = useMedia((s) => {
    const session = tabId ? s.sessions[tabId] : undefined;
    return !!session && session.controllable && session.playbackState !== "none" && !!(session.title || session.artwork);
  });
  return pinned && hasSession;
}

export function usePlayerEdge(windowId: string, anchor: Anchor | undefined, windowWidth: number): number {
  const sidebarWidth = useSidebarWidth(windowId);
  const side = useSidebarSide();
  if (!anchor) return 0;
  return side === "right"
    ? Math.min(anchor.x, windowWidth - sidebarWidth + layout.sidebarInset)
    : Math.max(anchor.x + anchor.width, sidebarWidth - layout.sidebarInset);
}

export function HoverPlayer({ tabId, windowId, anchor, windowWidth }: { tabId: string; windowId: string; anchor: Anchor; windowWidth: number }) {
  const theme = useTheme();
  const tokens = useMediaTokens();
  const side = useSidebarSide();
  const edge = usePlayerEdge(windowId, anchor, windowWidth);
  return (
    <Surface
      {...cardHoverProps}
      fill={tokens.background}
      cornerRadius={12}
      borderColor={hex(tokens.border)}
      borderWidth={0.5}
      shadowColor={ink.black}
      shadowOpacity={theme.panelShadowOpacity * 0.8}
      shadowRadius={16}
      shadowOffset={[0, 6]}
      style={{ position: "absolute", ...hoverCardOrigin(anchor, MINI_PLAYER_WIDTH, side, edge), width: MINI_PLAYER_WIDTH, height: MINI_PLAYER_HEIGHT }}
    >
      <MiniPlayer
        tabId={tabId}
        onBackToTab={() => {
          dismissHover();
          clickTab(windowId, tabId);
        }}
      />
    </Surface>
  );
}

if (__DEV__) {
  (globalThis as { acMediaHover?: unknown }).acMediaHover = async (windowId: string, tabId: string | null) => {
    if (!tabId) return setSidebarUi({ hover: null });
    const anchor = await measureRow(windowId, tabId);
    if (anchor) setSidebarUi({ hover: { windowId, kind: "tab", id: tabId, anchor } });
    return anchor;
  };
}
