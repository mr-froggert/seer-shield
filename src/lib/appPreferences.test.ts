import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_RISK_ADJUSTED_APY_PREFERENCES,
  normalizeRiskAdjustedApyPreferences,
  readRiskAdjustedApyPreferences,
  writeRiskAdjustedApyPreferences
} from "./appPreferences";

describe("app preferences", () => {
  it("normalizes and clamps persisted risk-adjusted APY settings", () => {
    expect(
      normalizeRiskAdjustedApyPreferences({
        enabled: true,
        assetDepegRecoverablePercent: 125,
        platformExploitRecoverablePercent: -20
      })
    ).toEqual({
      enabled: true,
      assetDepegRecoverablePercent: 100,
      platformExploitRecoverablePercent: 0
    });
  });

  it("reads persisted settings from storage and falls back safely", () => {
    const storage = {
      getItem: vi
        .fn()
        .mockReturnValueOnce('{"enabled":true,"assetDepegRecoverablePercent":90,"platformExploitRecoverablePercent":25}')
        .mockReturnValueOnce("{bad json")
    };

    expect(readRiskAdjustedApyPreferences(storage)).toEqual({
      enabled: true,
      assetDepegRecoverablePercent: 90,
      platformExploitRecoverablePercent: 25
    });
    expect(readRiskAdjustedApyPreferences(storage)).toEqual(DEFAULT_RISK_ADJUSTED_APY_PREFERENCES);
  });

  it("writes normalized settings back to storage", () => {
    const storage = {
      setItem: vi.fn()
    };

    writeRiskAdjustedApyPreferences(storage, {
      enabled: true,
      assetDepegRecoverablePercent: 101,
      platformExploitRecoverablePercent: -10
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      "yield-seer-risk-adjusted-apy",
      JSON.stringify({
        enabled: true,
        assetDepegRecoverablePercent: 100,
        platformExploitRecoverablePercent: 0
      })
    );
  });
});
