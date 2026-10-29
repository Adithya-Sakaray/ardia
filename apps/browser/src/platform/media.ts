import { call } from "@ardia/ardiacore";

export {
  CastMode,
  onCastDialog,
  onCastRoutes,
  showCastDialog,
  startCasting,
  stopCasting,
  closeCastDialog,
  watchCastRoutes,
  terminateCastRoute,
  changeCaptureSource,
  stopCapture,
  type CastSink,
  type CastDialog,
  type CastRoute,
  type DisplayMediaSource,
  type DisplayMediaAudio,
  type DisplayMediaRequest,
  type MediaCommand,
  type NowPlaying,
  type ControlPress,
  type PictureInPictureState,
} from "@ardia/ardiacore";

export const getDisplayMediaSources = () => call("media.displayMediaSources");
export const setDisplayMediaPicker = (enabled: boolean) => call("webView.setDisplayMediaPicker", { enabled });
export const setAutoPictureInPicture = (enabled: boolean) => call("webView.setAutoPictureInPicture", { enabled });
export const setVideoUpscaling = (enabled: boolean) => call("webView.setVideoUpscaling", { enabled });
