import type { RiskAdjustedApyPreferences } from "./types";

export const RISK_ADJUSTED_APY_STORAGE_KEY = "yield-seer-risk-adjusted-apy";

export const DEFAULT_RISK_ADJUSTED_APY_PREFERENCES: RiskAdjustedApyPreferences = {
  enabled: false,
  assetDepegRecoverablePercent: 85,
  platformExploitRecoverablePercent: 0
};

export interface AdjustedYieldSettings {
  enabled: boolean;
  assetDepegRecoverableFraction: number;
  platformExploitRecoverableFraction: number;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function normalizePercentValue(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return clampPercent(value);
}

export function normalizeRiskAdjustedApyPreferences(value: unknown): RiskAdjustedApyPreferences {
  if (typeof value !== "object" || value == null) {
    return DEFAULT_RISK_ADJUSTED_APY_PREFERENCES;
  }

  const candidate = value as Partial<RiskAdjustedApyPreferences>;

  return {
    enabled:
      typeof candidate.enabled === "boolean"
        ? candidate.enabled
        : DEFAULT_RISK_ADJUSTED_APY_PREFERENCES.enabled,
    assetDepegRecoverablePercent: normalizePercentValue(
      candidate.assetDepegRecoverablePercent,
      DEFAULT_RISK_ADJUSTED_APY_PREFERENCES.assetDepegRecoverablePercent
    ),
    platformExploitRecoverablePercent: normalizePercentValue(
      candidate.platformExploitRecoverablePercent,
      DEFAULT_RISK_ADJUSTED_APY_PREFERENCES.platformExploitRecoverablePercent
    )
  };
}

export function readRiskAdjustedApyPreferences(storage: Pick<Storage, "getItem"> | null | undefined) {
  if (!storage) {
    return DEFAULT_RISK_ADJUSTED_APY_PREFERENCES;
  }

  const rawValue = storage.getItem(RISK_ADJUSTED_APY_STORAGE_KEY);

  if (!rawValue) {
    return DEFAULT_RISK_ADJUSTED_APY_PREFERENCES;
  }

  try {
    return normalizeRiskAdjustedApyPreferences(JSON.parse(rawValue));
  } catch {
    return DEFAULT_RISK_ADJUSTED_APY_PREFERENCES;
  }
}

export function writeRiskAdjustedApyPreferences(
  storage: Pick<Storage, "setItem"> | null | undefined,
  preferences: RiskAdjustedApyPreferences
) {
  storage?.setItem(RISK_ADJUSTED_APY_STORAGE_KEY, JSON.stringify(normalizeRiskAdjustedApyPreferences(preferences)));
}

export function getAdjustedYieldSettings(preferences: RiskAdjustedApyPreferences): AdjustedYieldSettings {
  const normalized = normalizeRiskAdjustedApyPreferences(preferences);

  return {
    enabled: normalized.enabled,
    assetDepegRecoverableFraction: normalized.assetDepegRecoverablePercent / 100,
    platformExploitRecoverableFraction: normalized.platformExploitRecoverablePercent / 100
  };
}

export const RISK_ADJUSTED_APY_SETTINGS_TOOLTIP =
  "Globally adjusts APY displays with Seer exploit/depeg probabilities and your recovery assumptions. Risks stack with a simple independence assumption, so correlated events can make the estimate conservative or overstated.";

export const RISK_ADJUSTED_APY_INDICATOR_TOOLTIP =
  "This APY is adjusted using Seer exploit/depeg risk assumptions and your configured recovery settings.";
