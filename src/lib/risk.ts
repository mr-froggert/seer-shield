import { differenceInCalendarDays, parseISO } from "date-fns";
import { getAdjustedYieldSettings, DEFAULT_RISK_ADJUSTED_APY_PREFERENCES } from "./appPreferences";
import type { AdjustedYieldSettings } from "./appPreferences";
import type { ConfidenceBucket, OpportunityMetrics, RiskProfile, RiskSignal } from "./types";

function getConfidence(signals: RiskSignal[]): ConfidenceBucket {
  if (signals.length === 0) {
    return "insufficient";
  }

  const pricedSignals = signals.filter((signal) => signal.probabilitySource === "seer");
  const totalLiquidity = signals.reduce((total, signal) => total + signal.liquidityUsd, 0);
  const coverageRatio = pricedSignals.length / signals.length;

  if (pricedSignals.length === 0) {
    return "insufficient";
  }

  if (coverageRatio >= 0.75 && totalLiquidity >= 1000) {
    return "high";
  }

  if (coverageRatio >= 0.5 || totalLiquidity >= 100) {
    return "medium";
  }

  return "low";
}

export function annualizedApyToHorizonReturn(grossApy: number, horizonDays: number) {
  return grossApy * (horizonDays / 365);
}

export function horizonReturnToAnnualizedApy(value: number, horizonDays: number) {
  return value * (365 / horizonDays);
}

function getSignalLossSeverity(signal: Pick<RiskSignal, "kind">, settings: AdjustedYieldSettings) {
  switch (signal.kind) {
    case "depeg":
      return 1 - settings.assetDepegRecoverableFraction;
    case "exploit":
      return 1 - settings.platformExploitRecoverableFraction;
    default:
      return 0;
  }
}

function getSignalExpectedLoss(signal: RiskSignal, settings: AdjustedYieldSettings) {
  const severity = getSignalLossSeverity(signal, settings);
  const probability = signal.probability ?? 0;

  return probability * severity * 100;
}

export function combineIndependentExpectedLosses(losses: number[]) {
  if (losses.length === 0) {
    return 0;
  }

  return (
    (1 -
      losses.reduce((survival, loss) => survival * (1 - Math.min(1, Math.max(0, loss / 100))), 1)) *
    100
  );
}

export function resolveRiskHorizon(horizonEnds: string[]) {
  if (horizonEnds.length === 0) {
    return {
      horizonEnd: null,
      horizonDays: null,
      note: null
    };
  }

  const uniqueEnds = [...new Set(horizonEnds)].sort((left, right) => parseISO(left).getTime() - parseISO(right).getTime());
  const horizonEnd = uniqueEnds[uniqueEnds.length - 1] ?? null;
  const horizonDays =
    horizonEnd == null ? null : Math.max(1, differenceInCalendarDays(parseISO(horizonEnd), new Date()));

  return {
    horizonEnd,
    horizonDays,
    note:
      uniqueEnds.length > 1
        ? "Linked markets span multiple expiries, so carry is annualized to the latest linked market horizon."
        : null
  };
}

export function computeRiskProfile(input: {
  horizonEnd: string | null;
  metrics: OpportunityMetrics | null;
  signals: RiskSignal[];
  adjustedYieldSettings: AdjustedYieldSettings;
  horizonNote?: string | null;
}): RiskProfile {
  const adjustedYieldSettings = input.adjustedYieldSettings ?? getAdjustedYieldSettings(DEFAULT_RISK_ADJUSTED_APY_PREFERENCES);
  const horizonDays =
    input.horizonEnd == null ? null : Math.max(1, differenceInCalendarDays(parseISO(input.horizonEnd), new Date()));
  const grossYieldThroughExpiry =
    input.metrics?.grossApy != null && horizonDays != null
      ? annualizedApyToHorizonReturn(input.metrics.grossApy, horizonDays)
      : null;
  const signals = input.signals.map((signal) => ({
    ...signal,
    expectedLoss: getSignalExpectedLoss(signal, adjustedYieldSettings)
  }));
  const lossSignals = signals
    .map((signal) => signal.expectedLoss)
    .filter((value): value is number => value != null && Number.isFinite(value) && value > 0);
  const expectedLossThroughExpiry = signals.length > 0 ? combineIndependentExpectedLosses(lossSignals) : null;
  const riskAdjustedYieldThroughExpiry =
    grossYieldThroughExpiry != null && expectedLossThroughExpiry != null
      ? grossYieldThroughExpiry - expectedLossThroughExpiry
      : null;
  const derived90dEquivalent =
    riskAdjustedYieldThroughExpiry != null && horizonDays != null
      ? riskAdjustedYieldThroughExpiry * (90 / horizonDays)
      : null;
  const coverage = {
    configured: input.signals.length,
    priced: signals.filter((signal) => signal.probabilitySource === "seer" && signal.odds.length > 0).length,
    unpriced: signals.filter((signal) => signal.probabilitySource === "none").length,
    resolved: signals.filter((signal) => signal.resolvedValue != null).length,
    totalLiquidityUsd: signals.reduce((total, signal) => total + signal.liquidityUsd, 0)
  };
  const notes: string[] = [];

  if (input.horizonNote) {
    notes.push(input.horizonNote);
  }

  if (signals.some((signal) => signal.probabilitySource === "none")) {
    notes.push("Missing or unpriced linked markets are treated as 0% event probability for APY adjustment.");
  }

  if (coverage.priced === 0) {
    notes.push("Confidence is insufficient because none of the linked markets currently expose usable odds.");
  }

  if (signals.filter((signal) => getSignalLossSeverity(signal, adjustedYieldSettings) > 0).length > 1) {
    notes.push("Multiple risks use a simple independence assumption, so correlated failures can make loss estimates conservative or overstated.");
  }

  return {
    horizonEnd: input.horizonEnd,
    horizonDays,
    grossYieldThroughExpiry,
    expectedLossThroughExpiry,
    riskAdjustedYieldThroughExpiry,
    derived90dEquivalent,
    confidence: getConfidence(input.signals),
    coverage,
    signals,
    notes
  };
}
