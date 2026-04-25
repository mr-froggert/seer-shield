import type {
  RiskAdjustedApyPreferences,
  AppRegistry,
  AssetOverviewKind,
  AssetViewModel,
  ConfidenceBucket,
  CoreAssetOverviewViewModel,
  OpportunityRouteSummary,
  OpportunityViewModel,
  OverviewRelation,
  OverviewRelationEndpointType,
  OverviewRelationType,
  OverviewYieldRelationship,
  ProtocolOverviewViewModel,
  ProtocolViewModel,
  StablecoinOverviewViewModel,
  TokenizedBtcOverviewViewModel,
  YieldAssetOverviewViewModel
} from "./types";
import { DEFAULT_RISK_ADJUSTED_APY_PREFERENCES } from "./appPreferences";
import { annualizedApyToHorizonReturn, horizonReturnToAnnualizedApy } from "./risk";

export interface ResolvedOverviewRelation extends OverviewRelation {
  direction: "outgoing" | "incoming";
  currentType: OverviewRelationEndpointType;
  currentId: string;
  otherType: OverviewRelationEndpointType;
  otherId: string;
  effectiveRelationType: OverviewRelationType;
}

function getRelationEndpointKey(type: OverviewRelationEndpointType, id: string) {
  return `${type}:${id}`;
}

function getReverseRelationType(relationType: OverviewRelationType): OverviewRelationType {
  switch (relationType) {
    case "supports_yield_for":
      return "yield_available_on";
    case "yield_available_on":
      return "supports_yield_for";
    case "associated_asset":
      return "associated_protocol";
    case "associated_protocol":
      return "associated_asset";
  }
}

function sortRelations(left: ResolvedOverviewRelation, right: ResolvedOverviewRelation) {
  const leftPriority = left.priority ?? Number.MAX_SAFE_INTEGER;
  const rightPriority = right.priority ?? Number.MAX_SAFE_INTEGER;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  if (left.effectiveRelationType !== right.effectiveRelationType) {
    return left.effectiveRelationType.localeCompare(right.effectiveRelationType);
  }

  return `${left.otherType}:${left.otherId}`.localeCompare(`${right.otherType}:${right.otherId}`);
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

export function getOverviewRelationsForEntity(
  registry: AppRegistry,
  entityType: OverviewRelationEndpointType,
  entityId: string
) {
  const endpointKey = getRelationEndpointKey(entityType, entityId);
  const outgoing = (registry.outgoingRelationMap.get(endpointKey) ?? []).map<ResolvedOverviewRelation>((relation) => ({
    ...relation,
    direction: "outgoing",
    currentType: entityType,
    currentId: entityId,
    otherType: relation.toType,
    otherId: relation.toId,
    effectiveRelationType: relation.relationType
  }));
  const incoming = (registry.incomingRelationMap.get(endpointKey) ?? []).map<ResolvedOverviewRelation>((relation) => ({
    ...relation,
    direction: "incoming",
    currentType: entityType,
    currentId: entityId,
    otherType: relation.fromType,
    otherId: relation.fromId,
    effectiveRelationType: getReverseRelationType(relation.relationType)
  }));

  return [...outgoing, ...incoming].sort(sortRelations);
}

function buildYieldRelationships(
  registry: AppRegistry,
  currentType: OverviewRelationEndpointType,
  currentId: string,
  relations: ResolvedOverviewRelation[],
  opportunitiesById: Map<string, OpportunityViewModel>,
  preferences: RiskAdjustedApyPreferences = DEFAULT_RISK_ADJUSTED_APY_PREFERENCES
) {
  return relations
    .filter((relation) => Boolean(relation.opportunityId))
    .map((relation): OverviewYieldRelationship | null => {
      const opportunity = relation.opportunityId ? opportunitiesById.get(relation.opportunityId) ?? null : null;
      const currentProtocol = currentType === "protocol" ? registry.protocolMap.get(currentId) ?? null : null;
      const currentAsset = currentType === "asset" ? registry.assetMap.get(currentId) ?? null : null;
      const relatedProtocol = relation.otherType === "protocol" ? registry.protocolMap.get(relation.otherId) ?? null : null;
      const relatedAsset = relation.otherType === "asset" ? registry.assetMap.get(relation.otherId) ?? null : null;
      const protocol = opportunity?.protocol ?? currentProtocol ?? relatedProtocol;
      const asset = opportunity?.asset ?? currentAsset ?? relatedAsset;

      if (!protocol || !asset) {
        return null;
      }

      return {
        id: `${relation.effectiveRelationType}:${protocol.id}:${asset.id}:${relation.opportunityId ?? relation.otherId}`,
        relationType: relation.effectiveRelationType,
        protocol,
        asset,
        opportunity,
        chainIds: uniqueNumbers([
          ...(relation.chainIds ?? []),
          ...(opportunity ? [opportunity.chainId] : []),
          ...asset.chains,
          ...protocol.chains
        ]),
        label: relation.label,
        priority: relation.priority
      };
    })
    .filter((relationship): relationship is OverviewYieldRelationship => relationship != null)
    .sort((left, right) => {
      const leftPriority = left.priority ?? Number.MAX_SAFE_INTEGER;
      const rightPriority = right.priority ?? Number.MAX_SAFE_INTEGER;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      const leftApy = left.opportunity ? getOpportunityDisplayApy(left.opportunity, preferences) ?? Number.NEGATIVE_INFINITY : Number.NEGATIVE_INFINITY;
      const rightApy = right.opportunity ? getOpportunityDisplayApy(right.opportunity, preferences) ?? Number.NEGATIVE_INFINITY : Number.NEGATIVE_INFINITY;

      if (leftApy !== rightApy) {
        return rightApy - leftApy;
      }

      return left.protocol.name.localeCompare(right.protocol.name);
    });
}

function buildOverviewChains(defaultChains: number[], yieldRelationships: OverviewYieldRelationship[]) {
  return uniqueNumbers([...defaultChains, ...yieldRelationships.flatMap((relationship) => relationship.chainIds)]);
}

export function getConfidencePriority(confidence: ConfidenceBucket) {
  return {
    insufficient: 0,
    low: 1,
    medium: 2,
    high: 3
  }[confidence];
}

export function isOpportunityEligible(opportunity: OpportunityViewModel) {
  return isOpportunityEligibleWithPreference(opportunity, {
    enabled: false,
    assetDepegRecoverablePercent: 0,
    platformExploitRecoverablePercent: 0
  });
}

function opportunityHasPricedRisk(opportunity: OpportunityViewModel) {
  return opportunity.riskProfile.coverage.priced > 0;
}

export function getOpportunityAdjustedApy(opportunity: OpportunityViewModel) {
  if (!opportunityHasPricedRisk(opportunity)) {
    return opportunity.metrics?.grossApy ?? null;
  }

  if (opportunity.riskProfile.riskAdjustedYieldThroughExpiry == null || opportunity.riskProfile.horizonDays == null) {
    return null;
  }

  return horizonReturnToAnnualizedApy(
    opportunity.riskProfile.riskAdjustedYieldThroughExpiry,
    opportunity.riskProfile.horizonDays
  );
}

function getOpportunityDisplayApy(opportunity: OpportunityViewModel, preferences: RiskAdjustedApyPreferences) {
  if (!preferences.enabled) {
    return opportunity.metrics?.grossApy ?? null;
  }

  return getOpportunityAdjustedApy(opportunity);
}

function getOpportunityGross90d(opportunity: OpportunityViewModel) {
  if (opportunity.metrics?.grossApy == null) {
    return null;
  }

  return annualizedApyToHorizonReturn(opportunity.metrics.grossApy, 90);
}

function isOpportunityEligibleWithPreference(
  opportunity: OpportunityViewModel,
  preferences: RiskAdjustedApyPreferences
) {
  return (
    (
      preferences.enabled
        ? opportunityHasPricedRisk(opportunity)
          ? opportunity.riskProfile.derived90dEquivalent
          : getOpportunityGross90d(opportunity)
        : getOpportunityGross90d(opportunity)
    ) != null &&
    getConfidencePriority(opportunity.riskProfile.confidence) >= getConfidencePriority("medium")
  );
}

function buildRouteSummary(
  opportunity: OpportunityViewModel,
  preferences: RiskAdjustedApyPreferences
): OpportunityRouteSummary {
  const grossYieldToHorizon = opportunity.riskProfile.grossYieldThroughExpiry;
  const adjustedYieldToHorizon = opportunity.riskProfile.riskAdjustedYieldThroughExpiry;
  const grossYield90d = getOpportunityGross90d(opportunity);
  const adjustedYield90d = opportunityHasPricedRisk(opportunity)
    ? opportunity.riskProfile.derived90dEquivalent
    : grossYield90d;
  const adjustedApy = getOpportunityAdjustedApy(opportunity);
  const displayApy = preferences.enabled ? adjustedApy : opportunity.metrics?.grossApy ?? null;

  return {
    opportunity,
    grossApy: opportunity.metrics?.grossApy ?? null,
    adjustedApy,
    displayApy,
    expectedLossToHorizon: opportunity.riskProfile.expectedLossThroughExpiry,
    netYieldToHorizon: preferences.enabled ? (opportunityHasPricedRisk(opportunity) ? adjustedYieldToHorizon : grossYieldToHorizon) : grossYieldToHorizon,
    netYield90d: preferences.enabled ? adjustedYield90d : grossYield90d,
    confidence: opportunity.riskProfile.confidence,
    horizonEnd: opportunity.riskProfile.horizonEnd,
    horizonDays: opportunity.riskProfile.horizonDays,
    isEligible: isOpportunityEligibleWithPreference(opportunity, preferences)
  };
}

export function sortRouteSummaries(left: OpportunityRouteSummary, right: OpportunityRouteSummary) {
  if (left.isEligible !== right.isEligible) {
    return left.isEligible ? -1 : 1;
  }

  const leftNetYield = left.netYield90d ?? Number.NEGATIVE_INFINITY;
  const rightNetYield = right.netYield90d ?? Number.NEGATIVE_INFINITY;

  if (leftNetYield !== rightNetYield) {
    return rightNetYield - leftNetYield;
  }

  const confidenceDifference = getConfidencePriority(right.confidence) - getConfidencePriority(left.confidence);

  if (confidenceDifference !== 0) {
    return confidenceDifference;
  }

  const leftGrossApy = left.displayApy ?? left.grossApy ?? Number.NEGATIVE_INFINITY;
  const rightGrossApy = right.displayApy ?? right.grossApy ?? Number.NEGATIVE_INFINITY;

  if (leftGrossApy !== rightGrossApy) {
    return rightGrossApy - leftGrossApy;
  }

  return left.opportunity.title.localeCompare(right.opportunity.title);
}

function buildRouteSummaries(opportunities: OpportunityViewModel[], preferences: RiskAdjustedApyPreferences) {
  const routeSummaries = [
    ...new Map(opportunities.map((opportunity) => [opportunity.id, buildRouteSummary(opportunity, preferences)])).values()
  ];
  routeSummaries.sort(sortRouteSummaries);
  return routeSummaries;
}

function getBestEligibleOpportunity(routeSummaries: OpportunityRouteSummary[]) {
  return routeSummaries.find((route) => route.isEligible) ?? null;
}

export function buildProtocolOverviewViewModels(input: {
  registry: AppRegistry;
  protocols: ProtocolViewModel[];
  opportunities: OpportunityViewModel[];
  preferences?: RiskAdjustedApyPreferences;
}) {
  const preferences = input.preferences ?? DEFAULT_RISK_ADJUSTED_APY_PREFERENCES;
  const opportunitiesById = new Map(input.opportunities.map((opportunity) => [opportunity.id, opportunity]));

  return input.protocols.map<ProtocolOverviewViewModel>((protocol) => {
    const relations = getOverviewRelationsForEntity(input.registry, "protocol", protocol.id);
    const yieldRelationships = buildYieldRelationships(
      input.registry,
      "protocol",
      protocol.id,
      relations,
      opportunitiesById,
      preferences
    );
    const linkedOpportunities = yieldRelationships
      .map((relationship) => relationship.opportunity)
      .filter((opportunity): opportunity is OpportunityViewModel => opportunity != null);
    const linkedOpportunityRoutes = buildRouteSummaries(linkedOpportunities, preferences);

    return {
      ...protocol,
      kind: "protocol",
      yieldRelationships,
      overviewChains: buildOverviewChains(protocol.chains, yieldRelationships),
      linkedOpportunityRoutes,
      bestEligibleOpportunity: getBestEligibleOpportunity(linkedOpportunityRoutes)
    };
  });
}

function buildYieldAssetOverviewViewModels<TKind extends AssetOverviewKind>(input: {
  kind: TKind;
  registry: AppRegistry;
  assets: AssetViewModel[];
  opportunities: OpportunityViewModel[];
  preferences?: RiskAdjustedApyPreferences;
}) {
  const preferences = input.preferences ?? DEFAULT_RISK_ADJUSTED_APY_PREFERENCES;
  const opportunitiesById = new Map(input.opportunities.map((opportunity) => [opportunity.id, opportunity]));

  return input.assets.map<YieldAssetOverviewViewModel>((asset) => {
    const relations = getOverviewRelationsForEntity(input.registry, "asset", asset.id);
    const yieldRelationships = buildYieldRelationships(
      input.registry,
      "asset",
      asset.id,
      relations,
      opportunitiesById,
      preferences
    );
    const linkedOpportunities = yieldRelationships
      .map((relationship) => relationship.opportunity)
      .filter((opportunity): opportunity is OpportunityViewModel => opportunity != null);
    const linkedOpportunityRoutes = buildRouteSummaries(linkedOpportunities, preferences);

    return {
      ...asset,
      kind: input.kind,
      yieldRelationships,
      overviewChains: buildOverviewChains(asset.chains, yieldRelationships),
      linkedOpportunityRoutes,
      bestEligibleOpportunity: getBestEligibleOpportunity(linkedOpportunityRoutes)
    };
  });
}

export function buildStablecoinOverviewViewModels(input: {
  registry: AppRegistry;
  stablecoins: AssetViewModel[];
  opportunities: OpportunityViewModel[];
  preferences?: RiskAdjustedApyPreferences;
}) {
  return buildYieldAssetOverviewViewModels({
    kind: "stablecoin",
    registry: input.registry,
    assets: input.stablecoins,
    opportunities: input.opportunities,
    preferences: input.preferences
  }).map((asset) => ({
    ...asset,
    issuerProtocol: asset.protocol
  })) as StablecoinOverviewViewModel[];
}

export function buildTokenizedBtcOverviewViewModels(input: {
  registry: AppRegistry;
  assets: AssetViewModel[];
  opportunities: OpportunityViewModel[];
  preferences?: RiskAdjustedApyPreferences;
}) {
  return buildYieldAssetOverviewViewModels({
    kind: "tokenized-btc",
    registry: input.registry,
    assets: input.assets,
    opportunities: input.opportunities,
    preferences: input.preferences
  }).map((asset) => ({
    ...asset,
    issuerProtocol: asset.protocol
  })) as TokenizedBtcOverviewViewModel[];
}

export function buildCoreAssetOverviewViewModels(input: {
  registry: AppRegistry;
  assets: AssetViewModel[];
  opportunities: OpportunityViewModel[];
  preferences?: RiskAdjustedApyPreferences;
}) {
  return buildYieldAssetOverviewViewModels({
    kind: "core-asset",
    registry: input.registry,
    assets: input.assets,
    opportunities: input.opportunities,
    preferences: input.preferences
  }) as CoreAssetOverviewViewModel[];
}
