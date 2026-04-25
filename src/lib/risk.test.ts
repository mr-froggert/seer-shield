import { describe, expect, it } from "vitest";
import { getAdjustedYieldSettings } from "./appPreferences";
import { annualizedApyToHorizonReturn, combineIndependentExpectedLosses, computeRiskProfile } from "./risk";

const baseMetrics = {
  source: "defillama" as const,
  sourceId: "pool-id",
  grossApy: 8,
  apyBase: 6,
  apyReward: 2,
  tvlUsd: 10,
  rewardTokens: [],
  underlyingTokens: [],
  fetchedAt: new Date().toISOString(),
  warnings: []
};

function createSignal(overrides: Partial<Parameters<typeof computeRiskProfile>[0]["signals"][number]>) {
  return {
    kind: "exploit" as const,
    label: "Signal",
    marketName: "Signal",
    marketType: "categorical" as const,
    horizonEnd: "2026-12-31T23:59:59Z",
    probability: 0.02,
    probabilitySource: "seer" as const,
    resolvedValue: null,
    expectedLoss: null,
    liquidityUsd: 250,
    status: "unavailable" as const,
    odds: [2, 98],
    severity: 0.3,
    marketSyncStatus: "created" as const,
    ...overrides
  };
}

describe("risk modeling", () => {
  it("converts APY into the configured horizon", () => {
    expect(annualizedApyToHorizonReturn(12, 90)).toBeCloseTo(2.9589, 3);
  });

  it("computes exploit-only expected loss from recovery settings", () => {
    const profile = computeRiskProfile({
      horizonEnd: "2026-12-31T23:59:59Z",
      metrics: baseMetrics,
      signals: [createSignal({ kind: "exploit", probability: 0.02 })],
      adjustedYieldSettings: getAdjustedYieldSettings({
        enabled: true,
        assetDepegRecoverablePercent: 85,
        platformExploitRecoverablePercent: 0
      })
    });

    expect(profile.expectedLossThroughExpiry).toBeCloseTo(2, 5);
    expect(profile.riskAdjustedYieldThroughExpiry).not.toBeNull();
    expect(profile.derived90dEquivalent).not.toBeNull();
  });

  it("computes depeg-only expected loss from recovery settings", () => {
    const profile = computeRiskProfile({
      horizonEnd: "2026-12-31T23:59:59Z",
      metrics: baseMetrics,
      signals: [createSignal({ kind: "depeg", probability: 0.04 })],
      adjustedYieldSettings: getAdjustedYieldSettings({
        enabled: true,
        assetDepegRecoverablePercent: 90,
        platformExploitRecoverablePercent: 0
      })
    });

    expect(profile.expectedLossThroughExpiry).toBeCloseTo(0.4, 5);
  });

  it("combines exploit and depeg risk with the independence approximation", () => {
    const profile = computeRiskProfile({
      horizonEnd: "2026-12-31T23:59:59Z",
      metrics: baseMetrics,
      signals: [
        createSignal({ kind: "exploit", probability: 0.02 }),
        createSignal({ kind: "depeg", probability: 0.05, label: "Depeg" })
      ],
      adjustedYieldSettings: getAdjustedYieldSettings({
        enabled: true,
        assetDepegRecoverablePercent: 80,
        platformExploitRecoverablePercent: 0
      })
    });

    expect(profile.expectedLossThroughExpiry).toBeCloseTo(combineIndependentExpectedLosses([2, 1]), 5);
  });

  it("treats missing market probability as zero", () => {
    const profile = computeRiskProfile({
      horizonEnd: "2026-12-31T23:59:59Z",
      metrics: baseMetrics,
      signals: [
        createSignal({
          probability: null,
          probabilitySource: "none",
          odds: [],
          marketSyncStatus: "missing"
        })
      ],
      adjustedYieldSettings: getAdjustedYieldSettings({
        enabled: true,
        assetDepegRecoverablePercent: 85,
        platformExploitRecoverablePercent: 0
      })
    });

    expect(profile.expectedLossThroughExpiry).toBe(0);
    expect(profile.coverage.unpriced).toBe(1);
    expect(profile.notes).toContain("Missing or unpriced linked markets are treated as 0% event probability for APY adjustment.");
  });
});
