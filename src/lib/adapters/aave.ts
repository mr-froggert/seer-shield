import { decodeFunctionResult, formatUnits } from "viem";
import { AAVE_V3_GRAPHQL_ENDPOINT, CHAIN_LABELS } from "../constants";
import type { Opportunity, OpportunityMetrics } from "../types";

const AAVE_TIMEOUT_MS = 12_000;
const AAVE_SGHO_HISTORY_WINDOW_DAYS = 7;
const AAVE_APY_DECIMALS = 2;
const AAVE_USD_PRICE_PRECISION = 8;
const AAVE_UMBRELLA_RPC_ENDPOINT = "https://1rpc.io/eth";
const AAVE_UMBRELLA_STAKE_DATA_PROVIDER = "0x6321ba6b41fbddb6b678cd80db067f20a8770879";

const AAVE_MARKET_SLUGS_BY_NAME: Record<string, string> = {
  AaveV3Ethereum: "proto_mainnet_v3",
  AaveV3EthereumLido: "proto_lido_v3",
  AaveV3EthereumHorizon: "proto_horizon_v3",
  AaveV3EthereumEtherFi: "proto_etherfi_v3",
  AaveV3Arbitrum: "proto_arbitrum_v3",
  AaveV3BNB: "proto_bnb_v3",
  AaveV3Optimism: "proto_optimism_v3",
  AaveV3Polygon: "proto_polygon_v3",
  AaveV3Avalanche: "proto_avalanche_v3",
  AaveV3Base: "proto_base_v3"
};

const AAVE_CHAIN_KEYS_BY_ID: Record<number, string> = {
  1: "ethereum",
  10: "optimism",
  56: "bnb",
  137: "polygon",
  42161: "arbitrum",
  43114: "avalanche",
  8453: "base"
};

const AAVE_MARKET_DISPLAY_LABELS_BY_NAME: Record<string, string> = {
  AaveV3Ethereum: "Ethereum",
  AaveV3EthereumLido: "Ethereum Lido market",
  AaveV3EthereumHorizon: "Ethereum Horizon market",
  AaveV3EthereumEtherFi: "Ethereum EtherFi market",
  AaveV3Arbitrum: "Arbitrum",
  AaveV3BNB: "BNB Chain",
  AaveV3Optimism: "Optimism",
  AaveV3Polygon: "Polygon",
  AaveV3Avalanche: "Avalanche",
  AaveV3Base: "Base"
};

const AAVE_SGHO_MERIT_KEYS_BY_CHAIN_KEY: Record<string, string> = {
  ethereum: "ethereum-sgho"
};

const AAVE_UMBRELLA_STAKE_DATA_ABI = [
  {
    type: "function",
    name: "getStakeData",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "price", type: "uint256" },
          { name: "totalAssets", type: "uint256" },
          { name: "targetLiquidity", type: "uint256" },
          { name: "underlyingTokenAddress", type: "address" },
          { name: "underlyingTokenName", type: "string" },
          { name: "underlyingTokenSymbol", type: "string" },
          { name: "underlyingTokenDecimals", type: "uint8" },
          { name: "cooldownSeconds", type: "uint256" },
          { name: "unstakeWindowSeconds", type: "uint256" },
          { name: "underlyingIsStataToken", type: "bool" },
          {
            name: "stataTokenData",
            type: "tuple",
            components: [
              { name: "asset", type: "address" },
              { name: "assetName", type: "string" },
              { name: "assetSymbol", type: "string" },
              { name: "aToken", type: "address" },
              { name: "aTokenName", type: "string" },
              { name: "aTokenSymbol", type: "string" }
            ]
          },
          {
            name: "rewards",
            type: "tuple[]",
            components: [
              { name: "rewardAddress", type: "address" },
              { name: "rewardName", type: "string" },
              { name: "rewardSymbol", type: "string" },
              { name: "price", type: "uint256" },
              { name: "decimals", type: "uint8" },
              { name: "index", type: "uint256" },
              { name: "maxEmissionPerSecond", type: "uint256" },
              { name: "distributionEnd", type: "uint256" },
              { name: "currentEmissionPerSecond", type: "uint256" },
              { name: "apy", type: "uint256" }
            ]
          }
        ]
      }
    ]
  }
] as const;

interface AavePercentValue {
  value: string;
  formatted: string;
}

interface AaveReserveResponse {
  data?: {
    markets?: Array<{
      name: string;
      address: string;
      chain: {
        chainId: number;
        name: string;
      };
      supplyReserves: Array<{
        underlyingToken: {
          address: string;
          symbol: string;
          name: string;
          chainId: number;
        };
        supplyInfo: {
          apy: AavePercentValue;
        };
        incentives: Array<
          | {
              __typename: "MeritSupplyIncentive";
              extraSupplyApr: AavePercentValue;
              claimLink?: string | null;
            }
          | {
              __typename: "AaveSupplyIncentive";
              extraSupplyApr: AavePercentValue;
              rewardTokenSymbol?: string | null;
              rewardTokenAddress?: string | null;
            }
          | {
              __typename: string;
            }
        >;
      }>;
    }>;
  };
  errors?: Array<{ message: string }>;
}

type AaveMarket = NonNullable<NonNullable<AaveReserveResponse["data"]>["markets"]>[number];
type AaveSupplyReserve = AaveMarket["supplyReserves"][number];

interface AaveMeritAprResponse {
  currentAPR?: {
    actionsAPR?: Record<string, number | null | undefined>;
  };
}

interface AaveSghoHistoryResponse {
  data?: Array<{
    day?: {
      value?: string;
    };
    merit_apy?: number | null;
  }>;
}

type AaveUmbrellaStakeData = {
  tokenAddress: string;
  name: string;
  symbol: string;
  price: bigint;
  totalAssets: bigint;
  targetLiquidity: bigint;
  underlyingTokenAddress: string;
  underlyingTokenName: string;
  underlyingTokenSymbol: string;
  underlyingTokenDecimals: number;
  cooldownSeconds: bigint;
  unstakeWindowSeconds: bigint;
  underlyingIsStataToken: boolean;
  stataTokenData: {
    asset: string;
    assetName: string;
    assetSymbol: string;
    aToken: string;
    aTokenName: string;
    aTokenSymbol: string;
  };
  rewards: Array<{
    rewardAddress: string;
    rewardName: string;
    rewardSymbol: string;
    price: bigint;
    decimals: number;
    index: bigint;
    maxEmissionPerSecond: bigint;
    distributionEnd: bigint;
    currentEmissionPerSecond: bigint;
    apy: bigint;
  }>;
};

type AaveYieldDescriptor =
  | {
      kind: "reserve";
      marketAddress: string;
      tokenAddress: string;
    }
  | {
      kind: "savings";
      chainKey: string;
      assetSymbol: string;
    }
  | {
      kind: "umbrella";
      chainKey: string;
      assetSymbol: string;
    };

export interface AaveDiscoveredReserveRoute {
  sourceId: string;
  marketName: string;
  marketAddress: string;
  chainId: number;
  chainName: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  metrics: OpportunityMetrics;
}

function parsePercentValue(value: AavePercentValue | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = Number(value.value);
  return Number.isFinite(normalized) ? normalized * 100 : null;
}

function parseFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function parseAaveReserveSourceId(sourceId: string) {
  const [marketAddress, tokenAddress] = sourceId.split(":");

  if (!marketAddress || !tokenAddress) {
    throw new Error(`Invalid Aave reserve source id "${sourceId}"`);
  }

  return {
    marketAddress: marketAddress.toLowerCase(),
    tokenAddress: tokenAddress.toLowerCase()
  };
}

function parseAaveYieldSourceId(sourceId: string): AaveYieldDescriptor {
  if (sourceId.startsWith("reserve:")) {
    const [, marketAddress, tokenAddress] = sourceId.split(":");

    if (!marketAddress || !tokenAddress) {
      throw new Error(`Invalid Aave reserve source id "${sourceId}"`);
    }

    return {
      kind: "reserve",
      marketAddress: marketAddress.toLowerCase(),
      tokenAddress: tokenAddress.toLowerCase()
    };
  }

  if (sourceId.startsWith("savings:")) {
    const [, chainKey, assetSymbol] = sourceId.split(":");

    if (!chainKey || !assetSymbol) {
      throw new Error(`Invalid Aave savings source id "${sourceId}"`);
    }

    return {
      kind: "savings",
      chainKey: chainKey.toLowerCase(),
      assetSymbol: assetSymbol.toLowerCase()
    };
  }

  if (sourceId.startsWith("umbrella:")) {
    const [, chainKey, assetSymbol] = sourceId.split(":");

    if (!chainKey || !assetSymbol) {
      throw new Error(`Invalid Aave umbrella source id "${sourceId}"`);
    }

    return {
      kind: "umbrella",
      chainKey: chainKey.toLowerCase(),
      assetSymbol: assetSymbol.toLowerCase()
    };
  }

  return {
    kind: "reserve",
    ...parseAaveReserveSourceId(sourceId)
  };
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AAVE_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Aave request timed out after ${AAVE_TIMEOUT_MS / 1000}s`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJsonWithTimeout<T>(input: RequestInfo | URL, init?: RequestInit, errorPrefix?: string) {
  const response = await fetchWithTimeout(input, init);

  if (!response.ok) {
    throw new Error(`${errorPrefix ?? "Aave request"} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function getAaveReserveUrl(marketName: string, tokenAddress: string) {
  const marketSlug = AAVE_MARKET_SLUGS_BY_NAME[marketName];

  if (!marketSlug) {
    return "https://app.aave.com/markets/";
  }

  return `https://app.aave.com/reserve-overview/?underlyingAsset=${tokenAddress}&marketName=${marketSlug}`;
}

export function getAaveMarketDisplayLabel(marketName: string, chainId: number) {
  return AAVE_MARKET_DISPLAY_LABELS_BY_NAME[marketName] ?? `${CHAIN_LABELS[chainId] ?? `Chain ${chainId}`} market`;
}

function getAaveChainKey(chainId: number) {
  return AAVE_CHAIN_KEYS_BY_ID[chainId] ?? null;
}

function assertAaveChainKey(chainId: number, expectedChainKey: string) {
  const actualChainKey = getAaveChainKey(chainId);

  if (actualChainKey !== expectedChainKey) {
    throw new Error(
      `Aave source expects chain "${expectedChainKey}" but opportunity is configured for "${actualChainKey ?? chainId}"`
    );
  }
}

function getSghoHistoryUrl(now = new Date()) {
  const endDate = new Date(now);
  const startDate = new Date(now);
  startDate.setUTCDate(startDate.getUTCDate() - (AAVE_SGHO_HISTORY_WINDOW_DAYS - 1));

  const params = new URLSearchParams({
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    limit: "1000"
  });

  return `https://app.aave.com/api/sgho-apy/?${params.toString()}`;
}

async function fetchAaveReserveSnapshot(input: { chainId: number; marketAddress: string; tokenAddress: string }) {
  const markets = await fetchAaveMarkets([input.chainId]);
  const market = markets.find((entry) => entry.address.toLowerCase() === input.marketAddress);

  if (!market) {
    throw new Error(`Aave market "${input.marketAddress}" was not found on chain ${input.chainId}`);
  }

  const reserve = market.supplyReserves.find(
    (entry) => entry.underlyingToken.address.toLowerCase() === input.tokenAddress
  );

  if (!reserve) {
    throw new Error(`Aave reserve "${input.tokenAddress}" was not found in market "${market.name}"`);
  }

  return {
    market,
    reserve
  };
}

async function fetchAaveMarkets(chainIds: number[]): Promise<AaveMarket[]> {
  const normalizedChainIds = uniqueNumbers(chainIds.filter((chainId) => Number.isFinite(chainId)));

  if (normalizedChainIds.length === 0) {
    return [] as AaveMarket[];
  }

  const query = `
    query Markets($request: MarketsRequest!, $suppliesOrderBy: MarketReservesRequestOrderBy) {
      markets(request: $request) {
        name
        address
        chain {
          chainId
          name
        }
        supplyReserves: reserves(request: { reserveType: SUPPLY, orderBy: $suppliesOrderBy }) {
          underlyingToken {
            address
            symbol
            name
            chainId
          }
          supplyInfo {
            apy {
              value
              formatted
            }
          }
          incentives {
            __typename
            ... on MeritSupplyIncentive {
              extraSupplyApr {
                value
                formatted
              }
              claimLink
            }
            ... on AaveSupplyIncentive {
              extraSupplyApr {
                value
                formatted
              }
              rewardTokenSymbol
              rewardTokenAddress
            }
          }
        }
      }
    }
  `;
  const variables = {
    request: {
      chainIds: normalizedChainIds
    },
    suppliesOrderBy: {
      tokenName: "ASC"
    }
  };

  const payload = await fetchJsonWithTimeout<AaveReserveResponse>(
    AAVE_V3_GRAPHQL_ENDPOINT,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: "Markets",
        query,
        variables
      })
    },
    "Aave markets request"
  );

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload.data?.markets ?? [];
}

function buildAaveReserveMetrics(input: {
  sourceId: string;
  market: AaveMarket;
  reserve: AaveSupplyReserve;
}) {
  const apyBase = parsePercentValue(input.reserve.supplyInfo.apy);
  const supplyIncentives = input.reserve.incentives.filter(
    (incentive): incentive is Extract<
      (typeof input.reserve.incentives)[number],
      { __typename: "MeritSupplyIncentive" | "AaveSupplyIncentive" }
    > => incentive.__typename === "MeritSupplyIncentive" || incentive.__typename === "AaveSupplyIncentive"
  );
  const rewardValues = supplyIncentives
    .map((incentive) => parsePercentValue(incentive.extraSupplyApr))
    .filter((value): value is number => value != null && Number.isFinite(value));
  const apyReward = rewardValues.length > 0 ? rewardValues.reduce((total, value) => total + value, 0) : null;
  const rewardTokens = supplyIncentives
    .map((incentive) =>
      incentive.__typename === "AaveSupplyIncentive" ? incentive.rewardTokenSymbol ?? null : null
    )
    .filter((value): value is string => Boolean(value));
  const warnings =
    supplyIncentives.length > 0
      ? [`Gross APY includes ${supplyIncentives.length} Aave supply incentive${supplyIncentives.length === 1 ? "" : "s"}.`]
      : [];

  return {
    source: "aave",
    sourceId: input.sourceId,
    label: `${input.market.name} / ${input.reserve.underlyingToken.symbol}`,
    grossApy: (apyBase ?? 0) + (apyReward ?? 0),
    apyBase,
    apyReward,
    tvlUsd: null,
    rewardTokens,
    underlyingTokens: [input.reserve.underlyingToken.symbol],
    fetchedAt: new Date().toISOString(),
    url: getAaveReserveUrl(input.market.name, input.reserve.underlyingToken.address),
    warnings,
    components: []
  } satisfies OpportunityMetrics;
}

function buildAaveReserveSourceId(marketAddress: string, tokenAddress: string) {
  return `reserve:${marketAddress}:${tokenAddress}`;
}

function sortAaveDiscoveredRoutes(left: AaveDiscoveredReserveRoute, right: AaveDiscoveredReserveRoute) {
  const leftApy = left.metrics.grossApy ?? Number.NEGATIVE_INFINITY;
  const rightApy = right.metrics.grossApy ?? Number.NEGATIVE_INFINITY;

  if (leftApy !== rightApy) {
    return rightApy - leftApy;
  }

  if (left.chainId !== right.chainId) {
    return left.chainId - right.chainId;
  }

  return left.marketName.localeCompare(right.marketName);
}

export async function discoverAaveReserveRoutes(input: { assetSymbol: string; chainIds: number[] }) {
  const markets = await fetchAaveMarkets(input.chainIds);
  const targetSymbol = input.assetSymbol.toLowerCase();
  const discoveredRoutes = new Map<string, AaveDiscoveredReserveRoute>();

  for (const market of markets) {
    for (const reserve of market.supplyReserves) {
      if (reserve.underlyingToken.symbol.toLowerCase() !== targetSymbol) {
        continue;
      }

      const sourceId = buildAaveReserveSourceId(market.address, reserve.underlyingToken.address);

      discoveredRoutes.set(sourceId, {
        sourceId,
        marketName: market.name,
        marketAddress: market.address,
        chainId: market.chain.chainId,
        chainName: market.chain.name,
        tokenAddress: reserve.underlyingToken.address,
        tokenSymbol: reserve.underlyingToken.symbol,
        tokenName: reserve.underlyingToken.name,
        metrics: buildAaveReserveMetrics({
          sourceId,
          market,
          reserve
        })
      });
    }
  }

  return [...discoveredRoutes.values()].sort(sortAaveDiscoveredRoutes);
}

async function fetchAaveSavingsMetrics(opportunity: Pick<Opportunity, "chainId" | "yieldSourceId">, descriptor: Extract<AaveYieldDescriptor, { kind: "savings" }>) {
  assertAaveChainKey(opportunity.chainId, descriptor.chainKey);

  if (descriptor.assetSymbol !== "gho") {
    throw new Error(`Aave savings feed is not configured for "${descriptor.assetSymbol}"`);
  }

  const meritKey = AAVE_SGHO_MERIT_KEYS_BY_CHAIN_KEY[descriptor.chainKey];

  if (!meritKey) {
    throw new Error(`Aave savings feed is not configured for chain "${descriptor.chainKey}"`);
  }

  const [currentAprResult, historyResult] = await Promise.allSettled([
    fetchJsonWithTimeout<AaveMeritAprResponse>("https://apps.aavechan.com/api/merit/aprs", undefined, "Aave Merit APR request"),
    fetchJsonWithTimeout<AaveSghoHistoryResponse>(getSghoHistoryUrl(), undefined, "Aave sGHO history request")
  ]);

  const currentApr =
    currentAprResult.status === "fulfilled"
      ? parseFiniteNumber(currentAprResult.value.currentAPR?.actionsAPR?.[meritKey])
      : null;
  const historyApr =
    historyResult.status === "fulfilled"
      ? parseFiniteNumber(
          [...(historyResult.value.data ?? [])]
            .sort((left, right) => (right.day?.value ?? "").localeCompare(left.day?.value ?? ""))
            .map((entry) => (entry.merit_apy != null ? entry.merit_apy * 100 : null))[0]
        )
      : null;

  const grossApy = currentApr ?? historyApr;

  if (grossApy == null) {
    const messages = [currentAprResult, historyResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));

    throw new Error(messages.join("; ") || "Aave savings APY is unavailable");
  }

  const warnings =
    currentApr == null && historyApr != null
      ? ["Current sGHO Merit APR was unavailable. Using the latest official sGHO history sample instead."]
      : [];

  return {
    source: "aave",
    sourceId: opportunity.yieldSourceId,
    label: "Aave sGHO Savings / GHO",
    grossApy,
    apyBase: 0,
    apyReward: grossApy,
    tvlUsd: null,
    rewardTokens: ["GHO"],
    underlyingTokens: ["GHO"],
    fetchedAt: new Date().toISOString(),
    url: "https://app.aave.com/sgho/",
    warnings,
    components: []
  } satisfies OpportunityMetrics;
}

async function fetchAaveUmbrellaStakeData() {
  const payload = await fetchJsonWithTimeout<{
    result?: `0x${string}`;
    error?: { code: number; message: string };
  }>(
    AAVE_UMBRELLA_RPC_ENDPOINT,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: AAVE_UMBRELLA_STAKE_DATA_PROVIDER,
            data: "0xa16a09af"
          },
          "latest"
        ]
      })
    },
    "Aave Umbrella stake data request"
  );

  if (payload.error) {
    throw new Error(payload.error.message);
  }

  if (!payload.result) {
    throw new Error("Aave Umbrella stake data response did not include a result");
  }

  return decodeFunctionResult({
    abi: AAVE_UMBRELLA_STAKE_DATA_ABI,
    functionName: "getStakeData",
    data: payload.result
  }) as AaveUmbrellaStakeData[];
}

function normalizeUmbrellaRewardApy(rawApy: bigint) {
  return parseFiniteNumber(formatUnits(rawApy, AAVE_APY_DECIMALS)) ?? 0;
}

function normalizeUmbrellaTvlUsd(stakeData: AaveUmbrellaStakeData) {
  const tokenBalance = parseFiniteNumber(formatUnits(stakeData.totalAssets, stakeData.underlyingTokenDecimals));
  const tokenPriceUsd = parseFiniteNumber(formatUnits(stakeData.price, AAVE_USD_PRICE_PRECISION));

  if (tokenBalance == null || tokenPriceUsd == null) {
    return null;
  }

  return tokenBalance * tokenPriceUsd;
}

async function fetchAaveUmbrellaMetrics(opportunity: Pick<Opportunity, "chainId" | "yieldSourceId">, descriptor: Extract<AaveYieldDescriptor, { kind: "umbrella" }>) {
  assertAaveChainKey(opportunity.chainId, descriptor.chainKey);
  const stakeEntries = await fetchAaveUmbrellaStakeData();
  const stakeData = stakeEntries.find(
    (entry) => entry.underlyingTokenSymbol.toLowerCase() === descriptor.assetSymbol
  );

  if (!stakeData) {
    throw new Error(`Aave Umbrella stake data for "${descriptor.assetSymbol}" was not found`);
  }

  const apyReward = stakeData.rewards.reduce((total, reward) => total + normalizeUmbrellaRewardApy(reward.apy), 0);
  let apyBase = 0;
  const warnings: string[] = [];

  if (stakeData.underlyingIsStataToken) {
    const assetAddress = stakeData.stataTokenData.asset.toLowerCase();

    if (assetAddress && assetAddress !== "0x0000000000000000000000000000000000000000") {
      try {
        const reserveSnapshot = await fetchAaveReserveSnapshot({
          chainId: opportunity.chainId,
          marketAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
          tokenAddress: assetAddress
        });

        apyBase = parsePercentValue(reserveSnapshot.reserve.supplyInfo.apy) ?? 0;
      } catch (error) {
        warnings.push(
          error instanceof Error
            ? `Umbrella reward APY is live, but the underlying reserve APY could not be resolved: ${error.message}`
            : "Umbrella reward APY is live, but the underlying reserve APY could not be resolved."
        );
      }
    }
  }

  if (stakeData.rewards.length > 0) {
    warnings.unshift(
      `Gross APY includes ${stakeData.rewards.length} Umbrella reward${stakeData.rewards.length === 1 ? "" : "s"}.`
    );
  }

  return {
    source: "aave",
    sourceId: opportunity.yieldSourceId,
    label: `Aave Umbrella / ${stakeData.symbol}`,
    grossApy: apyBase + apyReward,
    apyBase,
    apyReward,
    tvlUsd: normalizeUmbrellaTvlUsd(stakeData),
    rewardTokens: stakeData.rewards.map((reward) => reward.rewardSymbol),
    underlyingTokens: [stakeData.underlyingTokenSymbol],
    fetchedAt: new Date().toISOString(),
    url: "https://app.aave.com/staking/",
    warnings,
    components: []
  } satisfies OpportunityMetrics;
}

async function fetchAaveReserveMetrics(opportunity: Pick<Opportunity, "chainId" | "yieldSourceId">, descriptor: Extract<AaveYieldDescriptor, { kind: "reserve" }>) {
  const { market, reserve } = await fetchAaveReserveSnapshot({
    chainId: opportunity.chainId,
    marketAddress: descriptor.marketAddress,
    tokenAddress: descriptor.tokenAddress
  });

  return buildAaveReserveMetrics({
    sourceId: opportunity.yieldSourceId,
    market,
    reserve
  });
}

export async function fetchOpportunityMetricsFromAave(opportunity: Pick<Opportunity, "chainId" | "yieldSourceId">) {
  const descriptor = parseAaveYieldSourceId(opportunity.yieldSourceId);

  switch (descriptor.kind) {
    case "reserve":
      return fetchAaveReserveMetrics(opportunity, descriptor);
    case "savings":
      return fetchAaveSavingsMetrics(opportunity, descriptor);
    case "umbrella":
      return fetchAaveUmbrellaMetrics(opportunity, descriptor);
  }
}
