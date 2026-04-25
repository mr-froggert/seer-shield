import { describe, expect, it } from "vitest";
import { createRegistry } from "./registry";
import { getOverviewRelationsForEntity } from "./overview";
import type { Asset, MarketGroup, Opportunity, OverviewRelation, Protocol } from "./types";

const protocols: Protocol[] = [
  {
    id: "aave",
    name: "Aave",
    website: "https://aave.com",
    category: "lending",
    chains: [1],
    tags: ["lending"],
    description: "Money market",
    status: "active"
  }
];

const assets: Asset[] = [
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    type: "stablecoin",
    protocolId: "aave",
    chains: [1],
    tags: ["stable"]
  }
];

const opportunities: Opportunity[] = [
  {
    id: "aave-usdc",
    title: "Aave USDC",
    protocolId: "aave",
    assetId: "usdc",
    chainId: 1,
    category: "lending",
    tags: ["stable"],
    yieldSource: "defillama",
    yieldSourceId: "pool-id",
    status: "active"
  }
];

const marketGroups: MarketGroup[] = [
  {
    id: "usdc-asset-risk",
    subjectType: "asset",
    subjectId: "usdc",
    horizonLabel: "Through Dec 31, 2026",
    horizonEnd: "2026-12-31T23:59:59Z",
    markets: []
  },
  {
    id: "aave-risk",
    subjectType: "opportunity",
    subjectId: "aave-usdc",
    horizonLabel: "Through Dec 31, 2026",
    horizonEnd: "2026-12-31T23:59:59Z",
    markets: []
  }
];

const relations: OverviewRelation[] = [
  {
    fromType: "protocol",
    fromId: "aave",
    toType: "asset",
    toId: "usdc",
    relationType: "supports_yield_for",
    opportunityId: "aave-usdc",
    chainIds: [1]
  }
];

describe("registry joins", () => {
  it("joins protocols, assets, opportunities, and market groups by id", () => {
    const registry = createRegistry({ protocols, assets, opportunities, relations, marketGroups });
    expect(registry.opportunities[0]?.protocol.name).toBe("Aave");
    expect(registry.opportunities[0]?.asset.symbol).toBe("USDC");
    expect(registry.opportunities[0]?.marketGroups.map((marketGroup) => marketGroup.id)).toEqual([
      "usdc-asset-risk",
      "aave-risk"
    ]);
  });

  it("fails clearly on missing references", () => {
    expect(() =>
      createRegistry({
        protocols,
        assets,
        opportunities: [
          {
            ...opportunities[0],
            assetId: "missing"
          }
        ],
        relations,
        marketGroups
      })
    ).toThrow('Opportunity "aave-usdc" references missing asset "missing"');
  });

  it("loads valid relations and derives reverse lookups from a single relation source", () => {
    const registry = createRegistry({ protocols, assets, opportunities, relations, marketGroups });
    const protocolRelations = getOverviewRelationsForEntity(registry, "protocol", "aave");
    const stablecoinRelations = getOverviewRelationsForEntity(registry, "asset", "usdc");

    expect(protocolRelations).toHaveLength(1);
    expect(protocolRelations[0]?.effectiveRelationType).toBe("supports_yield_for");
    expect(stablecoinRelations).toHaveLength(1);
    expect(stablecoinRelations[0]?.effectiveRelationType).toBe("yield_available_on");
    expect(stablecoinRelations[0]?.otherId).toBe("aave");
  });

  it("rejects duplicate and missing relation endpoints", () => {
    expect(() =>
      createRegistry({
        protocols,
        assets,
        opportunities,
        relations: [...relations, relations[0]!],
        marketGroups
      })
    ).toThrow('Duplicate relation "protocol:aave:asset:usdc:supports_yield_for:aave-usdc"');

    expect(() =>
      createRegistry({
        protocols,
        assets,
        opportunities,
        relations: [
          {
            fromType: "protocol",
            fromId: "aave",
            toType: "asset",
            toId: "missing",
            relationType: "supports_yield_for"
          }
        ],
        marketGroups
      })
    ).toThrow('Relation "supports_yield_for" references missing asset "missing"');
  });
});
