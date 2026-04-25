import { DEFILLAMA_PROTOCOL_ENDPOINT, DEFILLAMA_YIELDS_ENDPOINT } from "../constants";
import type { OpportunityMetrics, ProtocolMetrics, YieldComponentMetrics } from "../types";

const DEFILLAMA_TIMEOUT_MS = 12_000;

interface DefiLlamaPool {
  pool: string;
  chain?: string | null;
  project?: string | null;
  symbol?: string | null;
  poolMeta?: string | null;
  apy?: number | null;
  apyBase?: number | null;
  apyReward?: number | null;
  tvlUsd?: number | null;
  rewardTokens?: string[];
  underlyingTokens?: string[];
}

interface DefiLlamaProtocolTvlPoint {
  date?: number | null;
  totalLiquidityUSD?: number | null;
}

interface DefiLlamaProtocol {
  slug?: string | null;
  tvl?: DefiLlamaProtocolTvlPoint[] | null;
}

function getPoolLabel(pool: DefiLlamaPool) {
  return [pool.project, pool.symbol, pool.poolMeta].filter(Boolean).join(" / ") || pool.pool;
}

function toYieldComponent(metrics: OpportunityMetrics, role: YieldComponentMetrics["role"]): YieldComponentMetrics {
  return {
    role,
    source: metrics.source,
    sourceId: metrics.sourceId,
    label: metrics.label ?? metrics.sourceId,
    grossApy: metrics.grossApy,
    apyBase: metrics.apyBase,
    apyReward: metrics.apyReward,
    tvlUsd: metrics.tvlUsd,
    url: metrics.url
  };
}

function sumFinite(values: Array<number | null | undefined>) {
  const finiteValues = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finiteValues.length > 0 ? finiteValues.reduce((total, value) => total + value, 0) : null;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

let poolIndexPromise: Promise<Map<string, DefiLlamaPool>> | undefined;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFILLAMA_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`DefiLlama request timed out after ${DEFILLAMA_TIMEOUT_MS / 1000}s`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function normalizeDefiLlamaPool(pool: DefiLlamaPool): OpportunityMetrics {
  return {
    source: "defillama",
    sourceId: pool.pool,
    label: getPoolLabel(pool),
    grossApy: pool.apy ?? null,
    apyBase: pool.apyBase ?? null,
    apyReward: pool.apyReward ?? null,
    tvlUsd: pool.tvlUsd ?? null,
    rewardTokens: pool.rewardTokens ?? [],
    underlyingTokens: pool.underlyingTokens ?? [],
    fetchedAt: new Date().toISOString(),
    url: `https://defillama.com/yields/pool/${pool.pool}`,
    warnings: [],
    components: []
  };
}

export function composeOpportunityMetrics(
  primaryMetrics: OpportunityMetrics | null,
  underlyingMetrics: OpportunityMetrics[]
): OpportunityMetrics | null {
  if (!primaryMetrics) {
    return null;
  }

  const availableUnderlyingMetrics = underlyingMetrics.filter(Boolean);

  if (availableUnderlyingMetrics.length === 0) {
    return {
      ...primaryMetrics,
      components: primaryMetrics.components?.length
        ? primaryMetrics.components
        : [toYieldComponent(primaryMetrics, "route")]
    };
  }

  const components = [
    toYieldComponent(primaryMetrics, "route"),
    ...availableUnderlyingMetrics.map((metrics) => toYieldComponent(metrics, "underlying"))
  ];
  const grossApy = sumFinite(components.map((component) => component.grossApy));

  return {
    ...primaryMetrics,
    grossApy,
    apyBase: sumFinite(components.map((component) => component.apyBase)),
    apyReward: sumFinite(components.map((component) => component.apyReward)),
    rewardTokens: uniqueStrings([
      ...primaryMetrics.rewardTokens,
      ...availableUnderlyingMetrics.flatMap((metrics) => metrics.rewardTokens)
    ]),
    underlyingTokens: uniqueStrings([
      ...primaryMetrics.underlyingTokens,
      ...availableUnderlyingMetrics.flatMap((metrics) => metrics.underlyingTokens)
    ]),
    fetchedAt: new Date(
      Math.max(
        ...[primaryMetrics, ...availableUnderlyingMetrics].map((metrics) => new Date(metrics.fetchedAt).getTime())
      )
    ).toISOString(),
    warnings: [
      ...primaryMetrics.warnings,
      ...availableUnderlyingMetrics.flatMap((metrics) => metrics.warnings),
      `Gross APY includes ${availableUnderlyingMetrics.length} underlying yield layer${
        availableUnderlyingMetrics.length === 1 ? "" : "s"
      }. TVL remains the primary route TVL.`
    ],
    components
  };
}

export function normalizeDefiLlamaProtocol(projectId: string, pools: DefiLlamaPool[]): ProtocolMetrics {
  const apys = pools.map((pool) => pool.apy).filter((value): value is number => value != null && Number.isFinite(value));
  const totalTvlUsd = pools.reduce((total, pool) => total + (pool.tvlUsd ?? 0), 0);

  return {
    source: "defillama",
    sourceId: projectId,
    minApy: apys.length > 0 ? Math.min(...apys) : null,
    maxApy: apys.length > 0 ? Math.max(...apys) : null,
    totalTvlUsd,
    poolsCount: pools.length,
    fetchedAt: new Date().toISOString(),
    url: `https://defillama.com/yields?project=${encodeURIComponent(projectId)}`,
    warnings: pools.length === 0 ? [`No DefiLlama pools found for project "${projectId}"`] : []
  };
}

function getLatestFiniteProtocolTvlUsd(protocol: DefiLlamaProtocol) {
  const latestPoint = [...(protocol.tvl ?? [])]
    .reverse()
    .find((point) => point.totalLiquidityUSD != null && Number.isFinite(point.totalLiquidityUSD));

  return latestPoint?.totalLiquidityUSD ?? null;
}

export function normalizeDefiLlamaProtocolTvl(projectId: string, protocol: DefiLlamaProtocol): ProtocolMetrics {
  return {
    source: "defillama",
    sourceId: projectId,
    minApy: null,
    maxApy: null,
    totalTvlUsd: getLatestFiniteProtocolTvlUsd(protocol),
    poolsCount: 0,
    fetchedAt: new Date().toISOString(),
    url: `https://defillama.com/protocol/${encodeURIComponent(protocol.slug ?? projectId)}`,
    warnings: [
      "TVL is sourced from DefiLlama protocol data because no yield pools were found for this platform."
    ]
  };
}

async function fetchPoolIndex() {
  if (!poolIndexPromise) {
    poolIndexPromise = fetchWithTimeout(DEFILLAMA_YIELDS_ENDPOINT)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`DefiLlama yields request failed with ${response.status}`);
        }

        const payload = (await response.json()) as { data?: DefiLlamaPool[] };
        return new Map((payload.data ?? []).map((pool) => [pool.pool, pool]));
      })
      .catch((error) => {
        poolIndexPromise = undefined;
        throw error;
      });
  }

  return poolIndexPromise;
}

export async function fetchOpportunityMetricsFromDefiLlama(poolId: string) {
  const pools = await fetchPoolIndex();
  const pool = pools.get(poolId);

  if (!pool) {
    throw new Error(`DefiLlama pool "${poolId}" was not found`);
  }

  return normalizeDefiLlamaPool(pool);
}

export async function fetchProtocolMetricsFromDefiLlama(projectId: string) {
  const pools = await fetchPoolIndex();
  const matchingPools = [...pools.values()].filter((pool) => pool.project === projectId);

  if (matchingPools.length > 0) {
    return normalizeDefiLlamaProtocol(projectId, matchingPools);
  }

  const response = await fetchWithTimeout(`${DEFILLAMA_PROTOCOL_ENDPOINT}/${encodeURIComponent(projectId)}`);

  if (!response.ok) {
    throw new Error(`DefiLlama project "${projectId}" was not found`);
  }

  const protocol = (await response.json()) as DefiLlamaProtocol;
  const metrics = normalizeDefiLlamaProtocolTvl(projectId, protocol);

  if (metrics.totalTvlUsd == null) {
    throw new Error(`DefiLlama protocol "${projectId}" did not return a usable TVL`);
  }

  return metrics;
}

export function resetDefiLlamaPoolCache() {
  poolIndexPromise = undefined;
}
