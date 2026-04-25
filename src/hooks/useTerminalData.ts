import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { DEFAULT_SEER_CHAIN_ID } from "../lib/constants";
import {
  discoverAaveReserveRoutes,
  fetchOpportunityMetricsFromAave,
  getAaveMarketDisplayLabel,
  type AaveDiscoveredReserveRoute
} from "../lib/adapters/aave";
import {
  composeOpportunityMetrics,
  fetchOpportunityMetricsFromDefiLlama,
  fetchProtocolMetricsFromDefiLlama
} from "../lib/adapters/defillama";
import { fetchSeerRiskMarket, normalizeSeerMarket } from "../lib/adapters/seer";
import {
  buildProtocolOverviewViewModels,
  buildCoreAssetOverviewViewModels,
  buildStablecoinOverviewViewModels,
  buildTokenizedBtcOverviewViewModels
} from "../lib/overview";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { createRegistry, loadRegistry } from "../lib/registry";
import { computeRiskProfile, resolveRiskHorizon } from "../lib/risk";
import type {
  AppRegistry,
  Asset,
  AssetViewModel,
  LinkedMarketView,
  MarketGroup,
  OpportunityMetrics,
  Opportunity,
  OpportunityViewModel,
  OverviewRelation,
  ProtocolViewModel,
  RiskSignal,
  SubjectType
} from "../lib/types";

const baseRegistry = loadRegistry();

function matchesMarketGroupSubject(
  target: { id: string; protocolId: string; assetId: string },
  marketGroup: MarketGroup
) {
  return (
    (marketGroup.subjectType === "protocol" && marketGroup.subjectId === target.protocolId) ||
    (marketGroup.subjectType === "asset" && marketGroup.subjectId === target.assetId) ||
    (marketGroup.subjectType === "opportunity" && marketGroup.subjectId === target.id)
  );
}

function getSubjectLabelForRegistry(registry: AppRegistry, subjectType: SubjectType, subjectId: string) {
  if (subjectType === "protocol") {
    return registry.protocolMap.get(subjectId)?.name ?? subjectId;
  }

  if (subjectType === "asset") {
    return registry.assetMap.get(subjectId)?.symbol ?? subjectId;
  }

  return registry.opportunityMap.get(subjectId)?.title ?? subjectId;
}

function normalizeSignalsForGroup(
  marketGroup: MarketGroup,
  marketByDefinitionId: Map<string, Awaited<ReturnType<typeof fetchSeerRiskMarket>> | undefined>
) {
  return marketGroup.markets.map((definition) =>
    normalizeSeerMarket(definition, marketByDefinitionId.get(definition.id), marketGroup.horizonEnd)
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function isAaveReserveDiscoveryAsset(asset: Pick<Asset, "tags">) {
  return asset.tags.includes("stablecoin") || asset.tags.includes("aave-reserve-discovery");
}

function getAaveReserveDiscoveryChainIds(asset: Pick<Asset, "chains" | "tags">) {
  if (asset.tags.includes("stablecoin")) {
    const aaveChains = baseRegistry.protocolMap.get("aave")?.chains ?? [];
    return uniqueNumbers([...asset.chains, ...aaveChains]);
  }

  return asset.chains;
}

function getAaveReserveDiscoveryAssetSymbol(asset: Pick<Asset, "symbol" | "yieldDiscoverySymbol">) {
  return asset.yieldDiscoverySymbol ?? asset.symbol;
}

function isDiscoverableAaveReserveOpportunity(opportunity: Pick<Opportunity, "protocolId" | "assetId" | "yieldSource" | "yieldSourceId">, discoveryAssetIds: Set<string>) {
  return (
    opportunity.protocolId === "aave" &&
    opportunity.yieldSource === "aave" &&
    opportunity.yieldSourceId.startsWith("reserve:") &&
    discoveryAssetIds.has(opportunity.assetId)
  );
}

function buildDiscoveredAaveOpportunityId(assetId: string, route: Pick<AaveDiscoveredReserveRoute, "marketName" | "tokenAddress">) {
  return `aave-${assetId}-${slugify(route.marketName)}-${route.tokenAddress.toLowerCase().slice(2, 8)}`;
}

function buildDiscoveredAaveOpportunityTitle(assetSymbol: string, route: Pick<AaveDiscoveredReserveRoute, "marketName" | "chainId" | "tokenName">) {
  const marketLabel = getAaveMarketDisplayLabel(route.marketName, route.chainId);
  const tokenNameLabel = route.tokenName.toLowerCase().includes(assetSymbol.toLowerCase())
    ? marketLabel
    : `${marketLabel} (${route.tokenName})`;

  return `Aave ${assetSymbol} on ${tokenNameLabel}`;
}

function buildDiscoveredAaveOpportunitySummary(assetSymbol: string, route: Pick<AaveDiscoveredReserveRoute, "marketName" | "chainId">) {
  const marketLabel = getAaveMarketDisplayLabel(route.marketName, route.chainId);
  return `${assetSymbol} supplied into Aave on ${marketLabel}, using live reserve discovery instead of a manually enumerated chain list.`;
}

function getAaveDepositRelationPriority(registry: AppRegistry, assetId: string) {
  const nonAaveYieldPriorities = registry.relations
    .filter(
      (relation) =>
        relation.toType === "asset" &&
        relation.toId === assetId &&
        relation.relationType === "supports_yield_for" &&
        relation.fromType === "protocol" &&
        relation.fromId !== "aave"
    )
    .map((relation) => relation.priority ?? 1);

  return nonAaveYieldPriorities.length > 0 ? Math.max(...nonAaveYieldPriorities) + 1 : 2;
}

export function useTerminalData() {
  const { adjustedYieldSettings, riskAdjustedApy } = useAppPreferences();
  const discoveryAssets = useMemo(
    () => baseRegistry.assets.filter((asset) => isAaveReserveDiscoveryAsset(asset)),
    []
  );

  const discoveryAssetIds = useMemo(
    () => new Set(discoveryAssets.map((asset) => asset.id)),
    [discoveryAssets]
  );

  const aaveReserveDiscoveryQueries = useQueries({
    queries: discoveryAssets.map((asset) => ({
      queryKey: ["yield-source", "aave", "reserve-discovery", asset.id, ...getAaveReserveDiscoveryChainIds(asset)],
      queryFn: () =>
        discoverAaveReserveRoutes({
          assetSymbol: getAaveReserveDiscoveryAssetSymbol(asset),
          chainIds: getAaveReserveDiscoveryChainIds(asset)
        }),
      staleTime: 1000 * 60 * 10
    }))
  });

  const discoveredReserveRoutesByAssetId = useMemo(
    () =>
      new Map(
        discoveryAssets.map((asset, index) => [asset.id, aaveReserveDiscoveryQueries[index]?.data ?? []])
      ),
    [aaveReserveDiscoveryQueries, discoveryAssets]
  );

  const discoveredAave = useMemo(() => {
    const opportunities: Opportunity[] = [];
    const relations: OverviewRelation[] = [];
    const metricsByOpportunityId = new Map<string, OpportunityMetrics>();

    for (const asset of discoveryAssets) {
      const routes = discoveredReserveRoutesByAssetId.get(asset.id) ?? [];
      const priority = getAaveDepositRelationPriority(baseRegistry, asset.id);

      for (const route of routes) {
        const opportunityId = buildDiscoveredAaveOpportunityId(asset.id, route);

        opportunities.push({
          id: opportunityId,
          title: buildDiscoveredAaveOpportunityTitle(asset.symbol, route),
          protocolId: "aave",
          assetId: asset.id,
          chainId: route.chainId,
          category: "lending",
          tags: [...new Set(["aave", asset.type, "money-market", ...asset.tags])],
          summary: buildDiscoveredAaveOpportunitySummary(asset.symbol, route),
          yieldSource: "aave",
          yieldSourceId: route.sourceId,
          status: "active"
        });

        metricsByOpportunityId.set(opportunityId, route.metrics);
        relations.push({
          fromType: "protocol",
          fromId: "aave",
          toType: "asset",
          toId: asset.id,
          relationType: "supports_yield_for",
          opportunityId,
          chainIds: [route.chainId],
          label: "Aave deposit market",
          priority
        });
      }
    }

    return {
      opportunities,
      relations,
      metricsByOpportunityId
    };
  }, [discoveredReserveRoutesByAssetId, discoveryAssets]);

  const removedStaticOpportunityIds = useMemo(
    () =>
      new Set(
        baseRegistry.opportunities
          .filter((opportunity) => isDiscoverableAaveReserveOpportunity(opportunity, discoveryAssetIds))
          .map((opportunity) => opportunity.id)
      ),
    [discoveryAssetIds]
  );

  const registry = useMemo(
    () =>
      createRegistry({
        protocols: baseRegistry.protocols,
        assets: baseRegistry.assets,
        opportunities: [
          ...baseRegistry.opportunities.filter((opportunity) => !removedStaticOpportunityIds.has(opportunity.id)),
          ...discoveredAave.opportunities
        ],
        relations: [
          ...baseRegistry.relations.filter(
            (relation) => !relation.opportunityId || !removedStaticOpportunityIds.has(relation.opportunityId)
          ),
          ...discoveredAave.relations
        ],
        marketGroups: baseRegistry.marketGroups
      }),
    [discoveredAave.opportunities, discoveredAave.relations, removedStaticOpportunityIds]
  );

  const underlyingYieldPoolIds = useMemo(
    () =>
      [
        ...new Set(
          registry.opportunities.flatMap((opportunity) => opportunity.underlyingYieldSourceIds ?? [])
        )
      ],
    [registry]
  );

  const primaryOpportunityMetricQueries = useQueries({
    queries: registry.opportunities.map((opportunity) => ({
      queryKey: ["yield-source", opportunity.yieldSource, opportunity.yieldSourceId, opportunity.chainId],
      queryFn: () =>
        discoveredAave.metricsByOpportunityId.has(opportunity.id)
          ? Promise.resolve(discoveredAave.metricsByOpportunityId.get(opportunity.id) ?? null)
          : opportunity.yieldSource === "aave"
          ? fetchOpportunityMetricsFromAave(opportunity)
          : fetchOpportunityMetricsFromDefiLlama(opportunity.yieldSourceId),
      staleTime: 1000 * 60 * 10
    }))
  });

  const underlyingMetricQueries = useQueries({
    queries: underlyingYieldPoolIds.map((poolId) => ({
      queryKey: ["yield-source", "defillama", "underlying", poolId],
      queryFn: () => fetchOpportunityMetricsFromDefiLlama(poolId),
      staleTime: 1000 * 60 * 10
    }))
  });

  const protocolMetricQueries = useQueries({
    queries: registry.protocols
      .filter((protocol) => Boolean(protocol.defillamaProjectId))
      .map((protocol) => ({
        queryKey: ["yield-source", "defillama-project", protocol.defillamaProjectId],
        queryFn: () => fetchProtocolMetricsFromDefiLlama(protocol.defillamaProjectId!),
        staleTime: 1000 * 60 * 10
      }))
  });

  const marketDefinitions = useMemo(
    () =>
      registry.marketGroups.flatMap((marketGroup) =>
        marketGroup.markets
          .filter((market) => Boolean(market.seerMarketId))
          .map((market) => ({
            groupId: marketGroup.id,
            horizonEnd: marketGroup.horizonEnd,
            definition: market
          }))
      ),
    [registry]
  );

  const marketQueries = useQueries({
    queries: marketDefinitions.map(({ definition }) => ({
      queryKey: ["risk-market", "seer", definition.creation?.chainId ?? DEFAULT_SEER_CHAIN_ID, definition.seerMarketId],
      queryFn: () =>
        fetchSeerRiskMarket(definition.creation?.chainId ?? DEFAULT_SEER_CHAIN_ID, definition.seerMarketId!),
      staleTime: 1000 * 60 * 5
    }))
  });

  const primaryMetricsByOpportunityId = useMemo(
    () =>
      new Map(
        registry.opportunities.map((opportunity, index) => [opportunity.id, primaryOpportunityMetricQueries[index]?.data ?? null])
      ),
    [primaryOpportunityMetricQueries, registry]
  );

  const metricsByPoolId = useMemo(
    () => new Map(underlyingYieldPoolIds.map((poolId, index) => [poolId, underlyingMetricQueries[index]?.data ?? null])),
    [underlyingMetricQueries, underlyingYieldPoolIds]
  );

  const metricsByOpportunity = useMemo(
    () =>
      new Map(
        registry.opportunities.map((opportunity) => [
          opportunity.id,
          composeOpportunityMetrics(
            primaryMetricsByOpportunityId.get(opportunity.id) ?? null,
            (opportunity.underlyingYieldSourceIds ?? [])
              .map((poolId) => metricsByPoolId.get(poolId))
              .filter((metrics): metrics is OpportunityMetrics => metrics != null)
          )
        ])
      ),
    [metricsByPoolId, primaryMetricsByOpportunityId, registry]
  );

  const protocolsWithMetrics = useMemo(
    () => registry.protocols.filter((protocol) => Boolean(protocol.defillamaProjectId)),
    [registry]
  );

  const metricsByProtocol = useMemo(
    () =>
      new Map(
        protocolsWithMetrics.map((protocol, index) => [protocol.id, protocolMetricQueries[index]?.data ?? null])
      ),
    [protocolMetricQueries, protocolsWithMetrics]
  );

  const marketByDefinitionId = useMemo(
    () => new Map(marketDefinitions.map((item, index) => [item.definition.id, marketQueries[index]?.data])),
    [marketDefinitions, marketQueries]
  );

  const opportunities: OpportunityViewModel[] = useMemo(
    () =>
      registry.opportunities.map((opportunity) => {
        const metrics = metricsByOpportunity.get(opportunity.id) ?? null;
        const signals = opportunity.marketGroups.flatMap((marketGroup) =>
          normalizeSignalsForGroup(marketGroup, marketByDefinitionId)
        );
        const { horizonEnd, note } = resolveRiskHorizon(opportunity.marketGroups.map((marketGroup) => marketGroup.horizonEnd));

        return {
          ...opportunity,
          metrics,
          riskProfile: computeRiskProfile({
            horizonEnd,
            metrics,
            signals,
            adjustedYieldSettings,
            horizonNote: note
          })
        };
      }),
    [adjustedYieldSettings, marketByDefinitionId, metricsByOpportunity, registry]
  );

  const linkedMarkets: LinkedMarketView[] = useMemo(
    () =>
      registry.marketGroups.flatMap((marketGroup) => {
        const relatedOpportunities = opportunities.filter((opportunity) => matchesMarketGroupSubject(opportunity, marketGroup));

        return marketGroup.markets.map((definition) => ({
          subjectType: marketGroup.subjectType,
          subjectId: marketGroup.subjectId,
          subjectLabel: getSubjectLabelForRegistry(registry, marketGroup.subjectType, marketGroup.subjectId),
          opportunityIds: relatedOpportunities.map((opportunity) => opportunity.id),
          opportunityTitles: relatedOpportunities.map((opportunity) => opportunity.title),
          marketGroupId: marketGroup.id,
          marketGroupLabel: marketGroup.horizonLabel,
          signal: normalizeSeerMarket(
            definition,
            marketByDefinitionId.get(definition.id),
            marketGroup.horizonEnd
          )
        }));
      }),
    [marketByDefinitionId, opportunities, registry]
  );

  const protocolBaseViewModels: ProtocolViewModel[] = useMemo(
    () =>
      registry.protocols.map((protocol) => {
        const protocolOpportunities = opportunities.filter((opportunity) => opportunity.protocolId === protocol.id);
        const protocolMarketGroups = registry.marketGroups.filter(
          (marketGroup) => marketGroup.subjectType === "protocol" && marketGroup.subjectId === protocol.id
        );
        const protocolSignals: RiskSignal[] = protocolMarketGroups.flatMap((marketGroup) =>
          normalizeSignalsForGroup(marketGroup, marketByDefinitionId)
        );
        const { horizonEnd, note } = resolveRiskHorizon(
          protocolMarketGroups.map((marketGroup) => marketGroup.horizonEnd)
        );

        return {
          ...protocol,
          assets: registry.assets.filter((asset) => asset.protocolId === protocol.id),
          opportunities: protocolOpportunities,
          marketGroups: protocolMarketGroups,
          protocolMetrics: metricsByProtocol.get(protocol.id) ?? null,
          riskProfile: computeRiskProfile({
            horizonEnd,
            metrics: null,
            signals: protocolSignals,
            adjustedYieldSettings,
            horizonNote: note
          }),
          linkedMarkets: linkedMarkets.filter(
            (linkedMarket) => linkedMarket.subjectType === "protocol" && linkedMarket.subjectId === protocol.id
          )
        };
      }),
    [adjustedYieldSettings, linkedMarkets, marketByDefinitionId, metricsByProtocol, opportunities, registry]
  );

  const buildAssetBaseViewModels = useMemo(
    () =>
      (predicate: (asset: Asset) => boolean): AssetViewModel[] =>
        registry.assets.filter(predicate).map((asset) => {
          const marketGroups = registry.marketGroups.filter(
            (marketGroup) => marketGroup.subjectType === "asset" && marketGroup.subjectId === asset.id
          );
          const signals: RiskSignal[] = marketGroups.flatMap((marketGroup) =>
            normalizeSignalsForGroup(marketGroup, marketByDefinitionId)
          );
          const { horizonEnd, note } = resolveRiskHorizon(marketGroups.map((marketGroup) => marketGroup.horizonEnd));

          return {
            ...asset,
            protocol: registry.protocolMap.get(asset.protocolId)!,
            marketGroups,
            riskProfile: computeRiskProfile({
              horizonEnd,
              metrics: null,
              signals,
              adjustedYieldSettings,
              horizonNote: note
            }),
            linkedMarkets: linkedMarkets.filter(
              (linkedMarket) => linkedMarket.subjectType === "asset" && linkedMarket.subjectId === asset.id
            )
          };
        }),
    [adjustedYieldSettings, linkedMarkets, marketByDefinitionId, registry]
  );

  const stablecoinBaseViewModels: AssetViewModel[] = useMemo(
    () => buildAssetBaseViewModels((asset) => asset.type === "stablecoin" || asset.tags.includes("stablecoin")),
    [buildAssetBaseViewModels]
  );

  const tokenizedBtcBaseViewModels: AssetViewModel[] = useMemo(
    () => buildAssetBaseViewModels((asset) => asset.type === "tokenized-btc" || asset.tags.includes("tokenized-btc")),
    [buildAssetBaseViewModels]
  );

  const coreAssetBaseViewModels: AssetViewModel[] = useMemo(
    () => buildAssetBaseViewModels((asset) => asset.type === "core-asset" || asset.tags.includes("core-asset")),
    [buildAssetBaseViewModels]
  );

  const protocols = useMemo(
    () =>
      buildProtocolOverviewViewModels({
        registry,
        protocols: protocolBaseViewModels,
        opportunities,
        preferences: riskAdjustedApy
      }),
    [opportunities, protocolBaseViewModels, registry, riskAdjustedApy]
  );

  const stablecoins = useMemo(
    () =>
      buildStablecoinOverviewViewModels({
        registry,
        stablecoins: stablecoinBaseViewModels,
        opportunities,
        preferences: riskAdjustedApy
      }),
    [opportunities, riskAdjustedApy, stablecoinBaseViewModels, registry]
  );

  const tokenizedBtc = useMemo(
    () =>
      buildTokenizedBtcOverviewViewModels({
        registry,
        assets: tokenizedBtcBaseViewModels,
        opportunities,
        preferences: riskAdjustedApy
      }),
    [opportunities, riskAdjustedApy, tokenizedBtcBaseViewModels, registry]
  );

  const coreAssets = useMemo(
    () =>
      buildCoreAssetOverviewViewModels({
        registry,
        assets: coreAssetBaseViewModels,
        opportunities,
        preferences: riskAdjustedApy
      }),
    [coreAssetBaseViewModels, opportunities, registry, riskAdjustedApy]
  );

  const isLoading =
    primaryOpportunityMetricQueries.some((query) => query.isLoading) ||
    underlyingMetricQueries.some((query) => query.isLoading) ||
    protocolMetricQueries.some((query) => query.isLoading) ||
    marketQueries.some((query) => query.isLoading);
  const errors = [
    ...primaryOpportunityMetricQueries.map((query) => query.error),
    ...underlyingMetricQueries.map((query) => query.error),
    ...protocolMetricQueries.map((query) => query.error),
    ...marketQueries.map((query) => query.error)
  ].filter(Boolean);

  return {
    ...registry,
    opportunities,
    linkedMarkets,
    protocols,
    stablecoins,
    tokenizedBtc,
    coreAssets,
    isLoading,
    error: errors[0] instanceof Error ? errors[0] : null
  };
}
