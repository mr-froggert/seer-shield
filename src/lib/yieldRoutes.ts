import { formatPercent } from "./format";
import type { OpportunityRouteSummary, ProtocolOverviewViewModel, YieldAssetOverviewViewModel } from "./types";

export function getRouteDisplayApy(route: OpportunityRouteSummary) {
  return route.displayApy ?? route.grossApy ?? null;
}

function sortRoutesByDisplayApy(left: OpportunityRouteSummary, right: OpportunityRouteSummary) {
  const leftApy = getRouteDisplayApy(left) ?? Number.NEGATIVE_INFINITY;
  const rightApy = getRouteDisplayApy(right) ?? Number.NEGATIVE_INFINITY;

  if (leftApy !== rightApy) {
    return rightApy - leftApy;
  }

  const leftTvlUsd = left.opportunity.metrics?.tvlUsd ?? 0;
  const rightTvlUsd = right.opportunity.metrics?.tvlUsd ?? 0;

  if (leftTvlUsd !== rightTvlUsd) {
    return rightTvlUsd - leftTvlUsd;
  }

  return left.opportunity.title.localeCompare(right.opportunity.title);
}

export function getFilteredLinkedRoutes(
  asset: Pick<YieldAssetOverviewViewModel, "linkedOpportunityRoutes">,
  selectedChainIds: number[] = []
) {
  if (selectedChainIds.length === 0) {
    return asset.linkedOpportunityRoutes;
  }

  const selectedChains = new Set(selectedChainIds);
  return asset.linkedOpportunityRoutes.filter((route) => selectedChains.has(route.opportunity.chainId));
}

export function getLinkedApyRangeForRoutes(routes: OpportunityRouteSummary[]) {
  const apys = routes
    .map((route) => getRouteDisplayApy(route))
    .filter((value): value is number => value != null && Number.isFinite(value));

  if (apys.length === 0) {
    return {
      min: null,
      max: null,
      label: "N/A"
    };
  }

  const min = Math.min(...apys);
  const max = Math.max(...apys);

  return {
    min,
    max,
    label: Math.abs(min - max) < 0.01 ? formatPercent(max) : `${formatPercent(min)} - ${formatPercent(max)}`
  };
}

function getProtocolGrossApyRange(protocol: Pick<ProtocolOverviewViewModel, "protocolMetrics">) {
  return {
    min: protocol.protocolMetrics?.minApy ?? null,
    max: protocol.protocolMetrics?.maxApy ?? null
  };
}

function getProtocolRouteApyRange(
  protocol: Pick<ProtocolOverviewViewModel, "linkedOpportunityRoutes">,
  adjustedApyEnabled: boolean
) {
  const apys = protocol.linkedOpportunityRoutes
    .map((route) =>
      adjustedApyEnabled ? getRouteDisplayApy(route) : route.grossApy ?? getRouteDisplayApy(route)
    )
    .filter((value): value is number => value != null && Number.isFinite(value));

  if (apys.length === 0) {
    return null;
  }

  return {
    min: Math.min(...apys),
    max: Math.max(...apys)
  };
}

function hasPricedRouteRisk(protocol: Pick<ProtocolOverviewViewModel, "linkedOpportunityRoutes">) {
  return protocol.linkedOpportunityRoutes.some((route) => route.opportunity.riskProfile.coverage.priced > 0);
}

export function getProtocolLinkedApyRange(
  protocol: Pick<ProtocolOverviewViewModel, "linkedOpportunityRoutes" | "protocolMetrics">,
  adjustedApyEnabled: boolean
) {
  const routeApyRange = getProtocolRouteApyRange(protocol, adjustedApyEnabled);

  if (!adjustedApyEnabled) {
    return routeApyRange ?? getProtocolGrossApyRange(protocol);
  }

  if (!hasPricedRouteRisk(protocol)) {
    return getProtocolGrossApyRange(protocol);
  }

  return routeApyRange ?? getProtocolGrossApyRange(protocol);
}

export function getProtocolLinkedMaxApy(
  protocol: Pick<ProtocolOverviewViewModel, "linkedOpportunityRoutes" | "protocolMetrics">,
  adjustedApyEnabled: boolean
) {
  return getProtocolLinkedApyRange(protocol, adjustedApyEnabled).max;
}

export function getLinkedApyRange(
  asset: Pick<YieldAssetOverviewViewModel, "linkedOpportunityRoutes">,
  selectedChainIds: number[] = []
) {
  return getLinkedApyRangeForRoutes(getFilteredLinkedRoutes(asset, selectedChainIds));
}

export function getHighestLinkedApyRouteForRoutes(routes: OpportunityRouteSummary[]) {
  const eligibleRoutes = routes.filter((route) => {
    const displayApy = getRouteDisplayApy(route);
    return displayApy != null && Number.isFinite(displayApy);
  });

  if (eligibleRoutes.length === 0) {
    return null;
  }

  return [...eligibleRoutes].sort(sortRoutesByDisplayApy)[0] ?? null;
}

export function getHighestLinkedApyRoute(
  asset: Pick<YieldAssetOverviewViewModel, "linkedOpportunityRoutes">,
  selectedChainIds: number[] = []
) {
  return getHighestLinkedApyRouteForRoutes(getFilteredLinkedRoutes(asset, selectedChainIds));
}

export function getBestEligibleLinkedRoute(
  asset: Pick<YieldAssetOverviewViewModel, "linkedOpportunityRoutes">,
  selectedChainIds: number[] = []
) {
  const routes = getFilteredLinkedRoutes(asset, selectedChainIds).filter((route) => route.isEligible);

  if (routes.length === 0) {
    return null;
  }

  return [...routes].sort((left, right) => {
    const leftNetYield = left.netYield90d ?? Number.NEGATIVE_INFINITY;
    const rightNetYield = right.netYield90d ?? Number.NEGATIVE_INFINITY;

    if (leftNetYield !== rightNetYield) {
      return rightNetYield - leftNetYield;
    }

    return sortRoutesByDisplayApy(left, right);
  })[0] ?? null;
}
