import { describe, expect, it } from "vitest";
import { DEFAULT_RISK_ADJUSTED_APY_PREFERENCES } from "./appPreferences";
import {
  buildProtocolOverviewViewModels,
  buildStablecoinOverviewViewModels,
  buildTokenizedBtcOverviewViewModels
} from "./overview";
import { createRegistry } from "./registry";
import type {
  Asset,
  AssetViewModel,
  LinkedMarketView,
  MarketGroup,
  Opportunity,
  OpportunityViewModel,
  OverviewRelation,
  Protocol,
  ProtocolViewModel,
  RiskProfile
} from "./types";

const riskProfile: RiskProfile = {
  horizonEnd: "2026-12-31T23:59:59Z",
  horizonDays: 254,
  grossYieldThroughExpiry: null,
  expectedLossThroughExpiry: null,
  riskAdjustedYieldThroughExpiry: null,
  derived90dEquivalent: null,
  confidence: "insufficient",
  coverage: {
    configured: 0,
    priced: 0,
    unpriced: 0,
    resolved: 0,
    totalLiquidityUsd: 0
  },
  signals: [],
  notes: []
};

const linkedMarkets: LinkedMarketView[] = [];
const marketGroups: MarketGroup[] = [];

const protocols: Protocol[] = [
  {
    id: "aave",
    name: "Aave",
    website: "https://aave.com",
    category: "lending",
    chains: [1],
    tags: ["lending"],
    description: "Money market",
    status: "active",
    defillamaProjectId: "aave-v3"
  },
  {
    id: "sky",
    name: "Sky",
    website: "https://sky.money",
    category: "stablecoin",
    chains: [1],
    tags: ["stablecoin"],
    description: "Issuer",
    status: "active",
    defillamaProjectId: "sky-lending"
  },
  {
    id: "bitgo",
    name: "BitGo",
    website: "https://www.wbtc.network",
    category: "wrapped-btc",
    chains: [1, 8453],
    tags: ["wrapped-btc"],
    description: "WBTC issuer",
    status: "active"
  }
];

const assets: Asset[] = [
  {
    id: "gho",
    symbol: "GHO",
    name: "Aave GHO",
    type: "stablecoin",
    protocolId: "aave",
    chains: [1],
    tags: ["stablecoin"]
  },
  {
    id: "usds",
    symbol: "USDS",
    name: "Sky Dollar",
    type: "stablecoin",
    protocolId: "sky",
    chains: [1],
    tags: ["stablecoin"]
  },
  {
    id: "wbtc",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    type: "tokenized-btc",
    protocolId: "bitgo",
    chains: [1, 8453],
    tags: ["tokenized-btc"]
  }
];

const opportunities: Opportunity[] = [
  {
    id: "aave-gho-eth",
    title: "Aave GHO Savings on Ethereum",
    protocolId: "aave",
    assetId: "gho",
    chainId: 1,
    category: "stablecoin",
    tags: ["stablecoin"],
    yieldSource: "defillama",
    yieldSourceId: "pool-a",
    status: "active"
  },
  {
    id: "aave-usds-eth",
    title: "Aave USDS on Ethereum",
    protocolId: "aave",
    assetId: "usds",
    chainId: 1,
    category: "stablecoin",
    tags: ["stablecoin"],
    yieldSource: "defillama",
    yieldSourceId: "pool-b",
    status: "active"
  },
  {
    id: "sky-usds-eth",
    title: "Sky USDS Savings on Ethereum",
    protocolId: "sky",
    assetId: "usds",
    chainId: 1,
    category: "savings",
    tags: ["stablecoin"],
    yieldSource: "defillama",
    yieldSourceId: "pool-c",
    status: "active"
  },
  {
    id: "aave-wbtc-eth",
    title: "Aave WBTC on Ethereum",
    protocolId: "aave",
    assetId: "wbtc",
    chainId: 1,
    category: "lending",
    tags: ["tokenized-btc"],
    yieldSource: "defillama",
    yieldSourceId: "pool-d",
    status: "active"
  }
];

const relations: OverviewRelation[] = [
  {
    fromType: "protocol",
    fromId: "aave",
    toType: "asset",
    toId: "gho",
    relationType: "associated_asset",
    priority: 1
  },
  {
    fromType: "protocol",
    fromId: "aave",
    toType: "asset",
    toId: "gho",
    relationType: "supports_yield_for",
    opportunityId: "aave-gho-eth",
    chainIds: [1],
    priority: 2
  },
  {
    fromType: "protocol",
    fromId: "aave",
    toType: "asset",
    toId: "usds",
    relationType: "supports_yield_for",
    opportunityId: "aave-usds-eth",
    chainIds: [1],
    priority: 3
  },
  {
    fromType: "protocol",
    fromId: "sky",
    toType: "asset",
    toId: "usds",
    relationType: "supports_yield_for",
    opportunityId: "sky-usds-eth",
    chainIds: [1],
    priority: 1
  },
  {
    fromType: "protocol",
    fromId: "bitgo",
    toType: "asset",
    toId: "wbtc",
    relationType: "associated_asset",
    priority: 1
  },
  {
    fromType: "protocol",
    fromId: "aave",
    toType: "asset",
    toId: "wbtc",
    relationType: "supports_yield_for",
    opportunityId: "aave-wbtc-eth",
    chainIds: [1],
    priority: 4
  }
];

function createOpportunityViewModel(opportunity: Opportunity, metrics: OpportunityViewModel["metrics"]): OpportunityViewModel {
  const registry = createRegistry({ protocols, assets, opportunities, relations, marketGroups });
  const enriched = registry.opportunityMap.get(opportunity.id)!;

  return {
    ...enriched,
    metrics,
    riskProfile
  };
}

function createProtocolViewModel(protocolId: string, opportunityViewModels: OpportunityViewModel[]): ProtocolViewModel {
  const protocol = protocols.find((entry) => entry.id === protocolId)!;

  return {
    ...protocol,
    assets: assets.filter((asset) => asset.protocolId === protocolId),
    opportunities: opportunityViewModels.filter((opportunity) => opportunity.protocolId === protocolId),
    marketGroups,
    protocolMetrics: {
      source: "defillama",
      sourceId: protocol.defillamaProjectId ?? protocol.id,
      minApy: 1,
      maxApy: 5.5,
      totalTvlUsd: 1000000,
      poolsCount: 2,
      fetchedAt: new Date().toISOString(),
      warnings: []
    },
    riskProfile,
    linkedMarkets
  };
}

function createStablecoinViewModel(assetId: string): AssetViewModel {
  const asset = assets.find((entry) => entry.id === assetId)!;

  return {
    ...asset,
    protocol: protocols.find((protocol) => protocol.id === asset.protocolId)!,
    marketGroups,
    riskProfile,
    linkedMarkets
  };
}

describe("overview view models", () => {
  it("builds protocol overviews with related assets, stablecoins, and linked opportunities from relations", () => {
    const registry = createRegistry({ protocols, assets, opportunities, relations, marketGroups });
    const opportunityViewModels = [
      createOpportunityViewModel(opportunities[0]!, {
        source: "defillama",
        sourceId: "pool-a",
        grossApy: 5.6,
        apyBase: 5.4,
        apyReward: 0.2,
        tvlUsd: 100000,
        rewardTokens: [],
        underlyingTokens: [],
        fetchedAt: new Date().toISOString(),
        warnings: []
      }),
      createOpportunityViewModel(opportunities[1]!, {
        source: "defillama",
        sourceId: "pool-b",
        grossApy: 2.1,
        apyBase: 2.1,
        apyReward: 0,
        tvlUsd: 90000,
        rewardTokens: [],
        underlyingTokens: [],
        fetchedAt: new Date().toISOString(),
        warnings: []
      }),
      createOpportunityViewModel(opportunities[2]!, {
        source: "defillama",
        sourceId: "pool-c",
        grossApy: 3.75,
        apyBase: 3.75,
        apyReward: 0,
        tvlUsd: 120000,
        rewardTokens: [],
        underlyingTokens: [],
        fetchedAt: new Date().toISOString(),
        warnings: []
      })
    ];
    const overview = buildProtocolOverviewViewModels({
      registry,
      protocols: [createProtocolViewModel("aave", opportunityViewModels)],
      opportunities: opportunityViewModels
    })[0]!;

    expect(overview.overviewChains).toEqual([1, 8453]);
    expect(overview.yieldRelationships.map((relationship) => relationship.opportunity?.id)).toEqual([
      "aave-gho-eth",
      "aave-usds-eth",
      undefined
    ]);
    expect(overview.linkedOpportunityRoutes.map((route) => route.opportunity.id)).toEqual([
      "aave-gho-eth",
      "aave-usds-eth"
    ]);
    expect(overview.bestEligibleOpportunity).toBeNull();
  });

  it("builds stablecoin overviews with linked protocols and live APY from opportunity metrics", () => {
    const registry = createRegistry({ protocols, assets, opportunities, relations, marketGroups });
    const opportunityViewModels = [
      createOpportunityViewModel(opportunities[1]!, {
        source: "defillama",
        sourceId: "pool-b",
        grossApy: 2.01,
        apyBase: 2.01,
        apyReward: 0,
        tvlUsd: 15505213,
        rewardTokens: [],
        underlyingTokens: [],
        fetchedAt: new Date().toISOString(),
        warnings: []
      }),
      createOpportunityViewModel(opportunities[2]!, {
        source: "defillama",
        sourceId: "pool-c",
        grossApy: 3.75,
        apyBase: 3.75,
        apyReward: 0,
        tvlUsd: 5812439885,
        rewardTokens: [],
        underlyingTokens: [],
        fetchedAt: new Date().toISOString(),
        warnings: []
      })
    ];
    const overview = buildStablecoinOverviewViewModels({
      registry,
      stablecoins: [createStablecoinViewModel("usds")],
      opportunities: opportunityViewModels
    })[0]!;

    expect(new Set(overview.yieldRelationships.map((relationship) => relationship.protocol.name))).toEqual(
      new Set(["Sky", "Aave"])
    );
    expect(overview.yieldRelationships.map((relationship) => relationship.protocol.name)).toEqual(["Sky", "Aave"]);
    expect(overview.yieldRelationships[0]?.opportunity?.metrics?.grossApy).toBe(3.75);
    expect(overview.yieldRelationships[1]?.opportunity?.metrics?.grossApy).toBe(2.01);
    expect(overview.linkedOpportunityRoutes.map((route) => route.opportunity.id)).toEqual(["sky-usds-eth", "aave-usds-eth"]);
    expect(overview.bestEligibleOpportunity).toBeNull();
  });

  it("keeps linked relationships intact when live opportunity metrics are missing", () => {
    const registry = createRegistry({ protocols, assets, opportunities, relations, marketGroups });
    const opportunityViewModels = [createOpportunityViewModel(opportunities[0]!, null)];
    const overview = buildStablecoinOverviewViewModels({
      registry,
      stablecoins: [createStablecoinViewModel("gho")],
      opportunities: opportunityViewModels
    })[0]!;

    expect(overview.yieldRelationships).toHaveLength(1);
    expect(overview.yieldRelationships[0]?.opportunity?.metrics).toBeNull();
    expect(overview.linkedOpportunityRoutes).toHaveLength(1);
  });

  it("builds tokenized BTC overviews with issuer context and chain coverage", () => {
    const registry = createRegistry({ protocols, assets, opportunities, relations, marketGroups });
    const opportunityViewModels = [
      createOpportunityViewModel(opportunities[3]!, {
        source: "defillama",
        sourceId: "pool-d",
        grossApy: 0.8,
        apyBase: 0.8,
        apyReward: 0,
        tvlUsd: 150000,
        rewardTokens: [],
        underlyingTokens: [],
        fetchedAt: new Date().toISOString(),
        warnings: []
      })
    ];
    const overview = buildTokenizedBtcOverviewViewModels({
      registry,
      assets: [createStablecoinViewModel("wbtc")],
      opportunities: opportunityViewModels
    })[0]!;

    expect(overview.kind).toBe("tokenized-btc");
    expect(overview.issuerProtocol.id).toBe("bitgo");
    expect(overview.overviewChains).toEqual([1, 8453]);
    expect(overview.bestEligibleOpportunity).toBeNull();
    expect(overview.linkedOpportunityRoutes[0]?.opportunity.id).toBe("aave-wbtc-eth");
  });

  it("keeps gross ordering when adjusted mode has no priced risk to apply", () => {
    const registry = createRegistry({ protocols, assets, opportunities, relations, marketGroups });
    const grossLeader = createOpportunityViewModel(opportunities[1]!, {
      source: "defillama",
      sourceId: "pool-b",
      grossApy: 8,
      apyBase: 8,
      apyReward: 0,
      tvlUsd: 100,
      rewardTokens: [],
      underlyingTokens: [],
      fetchedAt: new Date().toISOString(),
      warnings: []
    });
    const adjustedLeader = createOpportunityViewModel(opportunities[2]!, {
      source: "defillama",
      sourceId: "pool-c",
      grossApy: 6,
      apyBase: 6,
      apyReward: 0,
      tvlUsd: 100,
      rewardTokens: [],
      underlyingTokens: [],
      fetchedAt: new Date().toISOString(),
      warnings: []
    });

    grossLeader.riskProfile = {
      ...riskProfile,
      grossYieldThroughExpiry: 4,
      expectedLossThroughExpiry: 3,
      riskAdjustedYieldThroughExpiry: 1,
      derived90dEquivalent: 0.45,
      confidence: "medium"
    };
    adjustedLeader.riskProfile = {
      ...riskProfile,
      grossYieldThroughExpiry: 3,
      expectedLossThroughExpiry: 0.5,
      riskAdjustedYieldThroughExpiry: 2.5,
      derived90dEquivalent: 1.2,
      confidence: "medium"
    };

    const stablecoin = createStablecoinViewModel("usds");
    const grossOverview = buildStablecoinOverviewViewModels({
      registry,
      stablecoins: [stablecoin],
      opportunities: [grossLeader, adjustedLeader],
      preferences: DEFAULT_RISK_ADJUSTED_APY_PREFERENCES
    })[0]!;
    const adjustedOverview = buildStablecoinOverviewViewModels({
      registry,
      stablecoins: [stablecoin],
      opportunities: [grossLeader, adjustedLeader],
      preferences: {
        enabled: true,
        assetDepegRecoverablePercent: 85,
        platformExploitRecoverablePercent: 0
      }
    })[0]!;

    expect(grossOverview.linkedOpportunityRoutes[0]?.opportunity.id).toBe("aave-usds-eth");
    expect(adjustedOverview.linkedOpportunityRoutes[0]?.opportunity.id).toBe("aave-usds-eth");
  });
});
