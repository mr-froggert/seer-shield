import { describe, expect, it } from "vitest";
import { getProtocolLinkedApyRange, getProtocolLinkedMaxApy } from "./yieldRoutes";
import type { OpportunityRouteSummary, ProtocolOverviewViewModel } from "./types";

function createRouteSummary(input: {
  grossApy: number;
  displayApy?: number;
  pricedRisk?: boolean;
}): OpportunityRouteSummary {
  return {
    opportunity: {
      id: "route-1",
      title: "Route 1",
      protocolId: "protocol-1",
      assetId: "asset-1",
      chainId: 1,
      category: "lending",
      tags: [],
      yieldSource: "defillama",
      yieldSourceId: "pool-1",
      status: "active",
      protocol: {
        id: "protocol-1",
        name: "Protocol 1",
        website: "https://example.com",
        category: "lending",
        chains: [1],
        tags: [],
        description: "Example",
        status: "active"
      },
      asset: {
        id: "asset-1",
        symbol: "AST",
        name: "Asset",
        type: "stablecoin",
        protocolId: "protocol-1",
        chains: [1],
        tags: []
      },
      marketGroups: [],
      metrics: {
        source: "defillama",
        sourceId: "pool-1",
        grossApy: input.grossApy,
        apyBase: input.grossApy,
        apyReward: 0,
        tvlUsd: 1000,
        rewardTokens: [],
        underlyingTokens: [],
        fetchedAt: new Date().toISOString(),
        warnings: []
      },
      riskProfile: {
        horizonEnd: "2026-12-31T23:59:59Z",
        horizonDays: 200,
        grossYieldThroughExpiry: 2,
        expectedLossThroughExpiry: input.pricedRisk ? 0.5 : 0,
        riskAdjustedYieldThroughExpiry: input.pricedRisk ? 1.5 : 2,
        derived90dEquivalent: input.pricedRisk ? 0.675 : 0.9,
        confidence: input.pricedRisk ? "medium" : "insufficient",
        coverage: {
          configured: input.pricedRisk ? 1 : 0,
          priced: input.pricedRisk ? 1 : 0,
          unpriced: 0,
          resolved: 0,
          totalLiquidityUsd: input.pricedRisk ? 1000 : 0
        },
        signals: [],
        notes: []
      }
    },
    grossApy: input.grossApy,
    adjustedApy: input.displayApy ?? input.grossApy,
    displayApy: input.displayApy ?? input.grossApy,
    expectedLossToHorizon: input.pricedRisk ? 0.5 : 0,
    netYieldToHorizon: input.pricedRisk ? 1.5 : 2,
    netYield90d: input.pricedRisk ? 0.675 : 0.9,
    confidence: input.pricedRisk ? "medium" : "insufficient",
    horizonEnd: "2026-12-31T23:59:59Z",
    horizonDays: 200,
    isEligible: Boolean(input.pricedRisk)
  };
}

function createProtocol(input: {
  minApy: number | null;
  maxApy: number | null;
  routes: OpportunityRouteSummary[];
}): Pick<ProtocolOverviewViewModel, "linkedOpportunityRoutes" | "protocolMetrics"> {
  return {
    linkedOpportunityRoutes: input.routes,
    protocolMetrics: {
      source: "defillama",
      sourceId: "protocol-1",
      minApy: input.minApy,
      maxApy: input.maxApy,
      totalTvlUsd: 1000,
      poolsCount: input.routes.length,
      fetchedAt: new Date().toISOString(),
      warnings: []
    }
  };
}

describe("protocol APY display helpers", () => {
  it("preserves the gross protocol range when adjusted mode has no priced risk to apply", () => {
    const protocol = createProtocol({
      minApy: 0,
      maxApy: 3.65,
      routes: [createRouteSummary({ grossApy: 3.65, pricedRisk: false })]
    });

    expect(getProtocolLinkedApyRange(protocol, true)).toEqual({
      min: 0,
      max: 3.65
    });
    expect(getProtocolLinkedMaxApy(protocol, true)).toBe(3.65);
  });

  it("uses route display APYs when adjusted mode has priced risk", () => {
    const protocol = createProtocol({
      minApy: 0,
      maxApy: 6,
      routes: [
        createRouteSummary({ grossApy: 6, displayApy: 4.5, pricedRisk: true }),
        createRouteSummary({ grossApy: 4, displayApy: 3.2, pricedRisk: true })
      ]
    });

    expect(getProtocolLinkedApyRange(protocol, true)).toEqual({
      min: 3.2,
      max: 4.5
    });
    expect(getProtocolLinkedMaxApy(protocol, true)).toBe(4.5);
  });

  it("uses linked route gross APYs when adjusted mode is off", () => {
    const protocol = createProtocol({
      minApy: 0,
      maxApy: 15.21,
      routes: [
        createRouteSummary({ grossApy: 13.4, displayApy: 10.8, pricedRisk: true }),
        createRouteSummary({ grossApy: 4.2, displayApy: 3.5, pricedRisk: true })
      ]
    });

    expect(getProtocolLinkedApyRange(protocol, false)).toEqual({
      min: 4.2,
      max: 13.4
    });
    expect(getProtocolLinkedMaxApy(protocol, false)).toBe(13.4);
  });

  it("falls back to the protocol aggregate when there are no linked routes", () => {
    const protocol = createProtocol({
      minApy: 0,
      maxApy: 15.21,
      routes: []
    });

    expect(getProtocolLinkedApyRange(protocol, false)).toEqual({
      min: 0,
      max: 15.21
    });
    expect(getProtocolLinkedMaxApy(protocol, false)).toBe(15.21);
  });
});
