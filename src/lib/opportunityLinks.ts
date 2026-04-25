import type { OpportunityRouteSummary, OpportunityViewModel } from "./types";

export function getOpportunityUrl(opportunity: Pick<OpportunityViewModel, "metrics">) {
  return opportunity.metrics?.url ?? null;
}

export function getRouteSummaryUrl(route: Pick<OpportunityRouteSummary, "opportunity"> | null) {
  return route ? getOpportunityUrl(route.opportunity) : null;
}
