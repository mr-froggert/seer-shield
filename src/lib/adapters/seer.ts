import { fetchMarket } from "@seer-pm/sdk/markets-fetch";
import { getMarketStatus, getMarketType } from "@seer-pm/sdk/market";
import { type Market, MarketStatus } from "@seer-pm/sdk/market-types";
import { initApiHost } from "@seer-pm/sdk/subgraph";
import { formatUnits } from "viem";
import { DEFAULT_SEER_API_HOST } from "../constants";
import type { ConfiguredRiskMarket, RiskSignal } from "../types";

initApiHost(DEFAULT_SEER_API_HOST);

const SEER_TIMEOUT_MS = 12_000;

function normalizeYesNoOdds(market: Market) {
  const yesIndex = market.outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const noIndex = market.outcomes.findIndex((outcome) => outcome.toLowerCase() === "no");

  if (yesIndex === -1 || noIndex === -1) {
    return null;
  }

  const yes = market.odds[yesIndex];
  const no = market.odds[noIndex];

  if (typeof yes === "number" && typeof no === "number") {
    const total = yes + no;
    if (total <= 0) {
      return null;
    }

    return yes / total;
  }

  // Seer can expose one-sided odds when liquidity only exists on one answer.
  if (typeof yes === "number") {
    return yes / 100;
  }

  if (typeof no === "number") {
    return 1 - no / 100;
  }

  return null;
}

function getResolvedBinaryValue(market: Market) {
  const yesIndex = market.outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const noIndex = market.outcomes.findIndex((outcome) => outcome.toLowerCase() === "no");

  if (!market.payoutReported || yesIndex === -1 || noIndex === -1) {
    return null;
  }

  const yes = Number(market.payoutNumerators[yesIndex] ?? 0n);
  const no = Number(market.payoutNumerators[noIndex] ?? 0n);
  const total = yes + no;

  if (total <= 0) {
    return null;
  }

  return yes / total;
}

function getScalarExpectedValue(market: Market) {
  const low = market.odds[0];
  const high = market.odds[1];

  if (typeof low !== "number" || typeof high !== "number") {
    return null;
  }

  const total = low + high;
  if (total <= 0) {
    return null;
  }

  const lowerBound = Number(formatUnits(market.lowerBound, 18));
  const upperBound = Number(formatUnits(market.upperBound, 18));

  return ((low / total) * lowerBound + (high / total) * upperBound) / 100;
}

function getResolvedScalarValue(market: Market) {
  if (!market.payoutReported) {
    return null;
  }

  const low = Number(market.payoutNumerators[0] ?? 0n);
  const high = Number(market.payoutNumerators[1] ?? 0n);
  const total = low + high;

  if (total <= 0) {
    return null;
  }

  const lowerBound = Number(formatUnits(market.lowerBound, 18));
  const upperBound = Number(formatUnits(market.upperBound, 18));

  return ((low / total) * lowerBound + (high / total) * upperBound) / 100;
}

function buildMarketUrl(chainId: number, marketId: string) {
  return `${DEFAULT_SEER_API_HOST.replace(/\/$/, "")}/markets/${chainId}/${marketId}`;
}

function getBinaryProbabilityFromMarket(market: Market) {
  return normalizeYesNoOdds(market) ?? getResolvedBinaryValue(market);
}

export function normalizeSeerMarket(
  definition: ConfiguredRiskMarket,
  market: Market | undefined,
  horizonEnd: string
): RiskSignal {
  const marketType = market ? String(getMarketType(market)) : undefined;
  const isScalar = definition.type === "scalar" || marketType === "scalar";
  const probability = market && !isScalar ? getBinaryProbabilityFromMarket(market) : null;
  const probabilitySource = probability !== null ? "seer" : "none";
  const resolvedValue =
    market && isScalar ? getResolvedScalarValue(market) : market ? getResolvedBinaryValue(market) : null;
  const odds = market?.odds.filter((value): value is number => typeof value === "number") ?? [];
  const liveStatus = market ? getMarketStatus(market) : "unavailable";
  const marketName = market?.marketName ?? definition.seed?.question ?? definition.label;

  let expectedLoss: number | null = null;
  if (isScalar) {
    const scalarValue = market ? getScalarExpectedValue(market) ?? resolvedValue : null;
    if (scalarValue != null) {
      expectedLoss = scalarValue <= 1 ? scalarValue * 100 : scalarValue;
    }
  } else if (probability != null) {
    expectedLoss = probability * definition.severity * 100;
  }

  return {
    kind: definition.kind,
    label: definition.label,
    marketId: definition.seerMarketId,
    marketName,
    marketType: definition.type,
    horizonEnd,
    probability,
    probabilitySource,
    resolvedValue,
    expectedLoss,
    liquidityUsd: market?.liquidityUSD ?? 0,
    status: liveStatus as MarketStatus | "unavailable",
    odds,
    severity: definition.severity,
    marketSyncStatus: definition.creation?.status ?? (definition.seerMarketId ? "created" : "missing"),
    notes: definition.notes,
    url: definition.seerMarketId
      ? buildMarketUrl(definition.creation?.chainId ?? 100, definition.seerMarketId)
      : undefined
  };
}

export async function fetchSeerRiskMarket(chainId: number, marketId: `0x${string}`) {
  return new Promise<Awaited<ReturnType<typeof fetchMarket>>>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Seer market request timed out after ${SEER_TIMEOUT_MS / 1000}s`));
    }, SEER_TIMEOUT_MS);

    fetchMarket(chainId, marketId)
      .then((market) => {
        clearTimeout(timeoutId);
        resolve(market);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}
