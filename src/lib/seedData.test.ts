import { describe, expect, it } from "vitest";
import { PLATFORM_SURFACE_TAG } from "./platforms";
import { loadRegistry } from "./registry";

describe("seed data integrity", () => {
  it("keeps every yield-linked protocol on the platform surface", () => {
    const registry = loadRegistry();
    const linkedProtocolIds = [
      ...new Set(
        registry.relations
          .filter(
            (relation) =>
              relation.fromType === "protocol" &&
              relation.toType === "asset" &&
              relation.relationType === "supports_yield_for"
          )
          .map((relation) => relation.fromId)
      )
    ].sort();

    const missingProtocols = linkedProtocolIds.filter((protocolId) => !registry.protocolMap.has(protocolId));
    const nonPlatformSurfaceProtocols = linkedProtocolIds.filter((protocolId) => {
      const protocol = registry.protocolMap.get(protocolId);
      return protocol != null && !protocol.tags.includes(PLATFORM_SURFACE_TAG);
    });

    expect(missingProtocols).toEqual([]);
    expect(nonPlatformSurfaceProtocols).toEqual([]);
  });

  it("configures Hyperliquid for protocol-level TVL and chain coverage", () => {
    const registry = loadRegistry();
    const hyperliquid = registry.protocolMap.get("hyperliquid");

    expect(hyperliquid).toMatchObject({
      defillamaProjectId: "hyperliquid",
      chains: [999, 42161]
    });
  });
});
