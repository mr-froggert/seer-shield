import type { Protocol } from "./types";

export const PLATFORM_SURFACE_TAG = "platform-surface";

export function isPlatformSurfaceProtocol(protocol: Pick<Protocol, "tags"> | { tags?: string[] }) {
  return (protocol.tags ?? []).includes(PLATFORM_SURFACE_TAG);
}
