import { afterEach, describe, expect, it, vi } from "vitest";
import {
  composeOpportunityMetrics,
  fetchProtocolMetricsFromDefiLlama,
  normalizeDefiLlamaPool,
  normalizeDefiLlamaProtocol,
  normalizeDefiLlamaProtocolTvl,
  resetDefiLlamaPoolCache
} from "./defillama";

describe("DefiLlama normalization", () => {
  afterEach(() => {
    resetDefiLlamaPoolCache();
    vi.restoreAllMocks();
  });

  it("maps a pool into internal opportunity metrics", () => {
    const metrics = normalizeDefiLlamaPool({
      pool: "pool-id",
      apy: 7.25,
      apyBase: 5,
      apyReward: 2.25,
      tvlUsd: 1_250_000,
      rewardTokens: ["REWARD"],
      underlyingTokens: ["USDC"]
    });

    expect(metrics.source).toBe("defillama");
    expect(metrics.sourceId).toBe("pool-id");
    expect(metrics.grossApy).toBe(7.25);
    expect(metrics.tvlUsd).toBe(1_250_000);
    expect(metrics.rewardTokens).toEqual(["REWARD"]);
  });

  it("composes route and underlying yield without double-counting route TVL", () => {
    const routeMetrics = normalizeDefiLlamaPool({
      pool: "route-pool",
      project: "aave-v3",
      symbol: "USDC",
      apy: 0,
      apyBase: 0,
      tvlUsd: 1_335_000_000,
      underlyingTokens: ["USDC"]
    });
    const underlyingMetrics = normalizeDefiLlamaPool({
      pool: "underlying-pool",
      project: "sky-lending",
      symbol: "USDS",
      apy: 1.96,
      tvlUsd: 1_568_000_000,
      underlyingTokens: ["USDC"]
    });

    const metrics = composeOpportunityMetrics(routeMetrics, [underlyingMetrics]);

    expect(metrics?.sourceId).toBe("route-pool");
    expect(metrics?.grossApy).toBe(1.96);
    expect(metrics?.tvlUsd).toBe(1_335_000_000);
    expect(metrics?.components).toEqual([
      expect.objectContaining({ role: "route", sourceId: "route-pool", grossApy: 0 }),
      expect.objectContaining({ role: "underlying", sourceId: "underlying-pool", grossApy: 1.96 })
    ]);
  });

  it("aggregates protocol-wide metrics from multiple pools", () => {
    const metrics = normalizeDefiLlamaProtocol("aave-v3", [
      {
        pool: "pool-1",
        project: "aave-v3",
        apy: 1.5,
        tvlUsd: 1_000_000
      },
      {
        pool: "pool-2",
        project: "aave-v3",
        apy: 4.25,
        tvlUsd: 2_500_000
      }
    ]);

    expect(metrics.sourceId).toBe("aave-v3");
    expect(metrics.minApy).toBe(1.5);
    expect(metrics.maxApy).toBe(4.25);
    expect(metrics.totalTvlUsd).toBe(3_500_000);
    expect(metrics.poolsCount).toBe(2);
  });

  it("normalizes protocol-level TVL when no yield pools exist", () => {
    const metrics = normalizeDefiLlamaProtocolTvl("hyperliquid", {
      slug: "hyperliquid",
      tvl: [
        { date: 1_700_000_000, totalLiquidityUSD: 3_100_000_000 },
        { date: 1_800_000_000, totalLiquidityUSD: 4_721_685_543 }
      ]
    });

    expect(metrics.sourceId).toBe("hyperliquid");
    expect(metrics.minApy).toBeNull();
    expect(metrics.maxApy).toBeNull();
    expect(metrics.totalTvlUsd).toBe(4_721_685_543);
    expect(metrics.url).toBe("https://defillama.com/protocol/hyperliquid");
  });

  it("falls back to the protocol TVL endpoint when the yields feed has no project match", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          slug: "hyperliquid",
          tvl: [{ date: 1_800_000_000, totalLiquidityUSD: 4_721_685_543 }]
        })
      });

    vi.stubGlobal("fetch", fetchMock);

    const metrics = await fetchProtocolMetricsFromDefiLlama("hyperliquid");

    expect(metrics.totalTvlUsd).toBe(4_721_685_543);
    expect(metrics.poolsCount).toBe(0);
    expect(metrics.warnings).toContain(
      "TVL is sourced from DefiLlama protocol data because no yield pools were found for this platform."
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://api.llama.fi/protocol/hyperliquid", expect.any(Object));
  });
});
