import { formatDate, formatPercent } from "./format";
import { getHighestLinkedApyRouteForRoutes } from "./yieldRoutes";
import type { ConfidenceBucket, OpportunityRouteSummary, Protocol, ProtocolOverviewViewModel } from "./types";

function getRouteDisplayApy(route: OpportunityRouteSummary) {
  return route.displayApy ?? route.grossApy ?? null;
}

export type YieldAssetProtocolSortBy = "safety" | "apy";

export interface YieldAssetProtocolRow {
  protocol: Protocol;
  protocolOverview: ProtocolOverviewViewModel | null;
  routes: OpportunityRouteSummary[];
  highestApyRoute: OpportunityRouteSummary | null;
  chains: number[];
  apyLabel: string;
  safetyValue: number | null;
  safetyLabel: string;
  confidenceLabel: ConfidenceBucket | "mixed";
  horizonLabel: string;
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function getProtocolSafetyValue(protocolOverview: ProtocolOverviewViewModel | null) {
  if (!protocolOverview || protocolOverview.riskProfile.coverage.priced === 0) {
    return null;
  }

  return protocolOverview.riskProfile.expectedLossThroughExpiry;
}

export function formatMetricRange(values: Array<number | null | undefined>) {
  const finiteValues = values.filter((value): value is number => value != null && Number.isFinite(value));

  if (finiteValues.length === 0) {
    return "N/A";
  }

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);

  return Math.abs(min - max) < 0.01 ? formatPercent(max) : `${formatPercent(min)} - ${formatPercent(max)}`;
}

export function sortRoutesByApyThenTitle(left: OpportunityRouteSummary, right: OpportunityRouteSummary) {
  const leftApy = getRouteDisplayApy(left) ?? Number.NEGATIVE_INFINITY;
  const rightApy = getRouteDisplayApy(right) ?? Number.NEGATIVE_INFINITY;

  if (leftApy !== rightApy) {
    return rightApy - leftApy;
  }

  return left.opportunity.title.localeCompare(right.opportunity.title);
}

export function sortYieldAssetProtocolRows(rows: YieldAssetProtocolRow[], sortBy: YieldAssetProtocolSortBy) {
  return [...rows].sort((left, right) => {
    const leftSafety = left.safetyValue ?? Number.POSITIVE_INFINITY;
    const rightSafety = right.safetyValue ?? Number.POSITIVE_INFINITY;
    const leftMaxApy = left.highestApyRoute ? getRouteDisplayApy(left.highestApyRoute) ?? Number.NEGATIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const rightMaxApy = right.highestApyRoute ? getRouteDisplayApy(right.highestApyRoute) ?? Number.NEGATIVE_INFINITY : Number.NEGATIVE_INFINITY;

    if (sortBy === "apy" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    if (leftSafety !== rightSafety) {
      return leftSafety - rightSafety;
    }

    if (sortBy === "safety" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    return left.protocol.name.localeCompare(right.protocol.name);
  });
}

export function buildYieldAssetProtocolRows(
  routeRows: OpportunityRouteSummary[],
  protocolMap?: Map<string, ProtocolOverviewViewModel>
): YieldAssetProtocolRow[] {
  const groupedRows = new Map<string, OpportunityRouteSummary[]>();

  for (const route of routeRows) {
    const protocolId = route.opportunity.protocol.id;
    groupedRows.set(protocolId, [...(groupedRows.get(protocolId) ?? []), route]);
  }

  return [...groupedRows.values()].map((routes) => {
    const protocol = routes[0]!.opportunity.protocol;
    const protocolOverview = protocolMap?.get(protocol.id) ?? null;
    const highestApyRoute = getHighestLinkedApyRouteForRoutes(routes);
    const confidenceValues = [...new Set(routes.map((route) => route.confidence))];
    const horizonValues = [...new Set(routes.map((route) => route.horizonEnd ?? "N/A"))];
    const safetyValue = getProtocolSafetyValue(protocolOverview);

    return {
      protocol,
      protocolOverview,
      routes,
      highestApyRoute,
      chains: uniqueNumbers(routes.map((route) => route.opportunity.chainId)),
      apyLabel: formatMetricRange(routes.map((route) => getRouteDisplayApy(route))),
      safetyValue,
      safetyLabel: safetyValue == null ? "Unpriced" : formatPercent(safetyValue),
      confidenceLabel: confidenceValues.length === 1 ? confidenceValues[0]! : "mixed",
      horizonLabel:
        horizonValues.length === 1 ? (horizonValues[0] === "N/A" ? "N/A" : formatDate(horizonValues[0]!)) : "Mixed"
    };
  });
}
