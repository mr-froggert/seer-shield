import protocolsJson from "../../data/protocols.json";
import assetsJson from "../../data/assets.json";
import opportunitiesJson from "../../data/opportunities.json";
import relationsJson from "../../data/relations.json";
import marketGroupsJson from "../../data/market-groups.json";
import type {
  AppRegistry,
  Asset,
  EnrichedOpportunity,
  MarketGroup,
  OverviewRelation,
  Opportunity,
  Protocol
} from "./types";

function assertUniqueIds<T extends { id: string }>(items: T[], label: string) {
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate ${label} id "${item.id}"`);
    }
    seen.add(item.id);
  }
}

function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function getRelationEndpointKey(type: OverviewRelation["fromType"], id: string) {
  return `${type}:${id}`;
}

function assertUniqueRelations(relations: OverviewRelation[]) {
  const seen = new Set<string>();

  for (const relation of relations) {
    const key = [
      relation.fromType,
      relation.fromId,
      relation.toType,
      relation.toId,
      relation.relationType,
      relation.opportunityId ?? ""
    ].join(":");

    if (seen.has(key)) {
      throw new Error(`Duplicate relation "${key}"`);
    }

    seen.add(key);
  }
}

function matchesSubject(
  opportunity: Opportunity,
  marketGroup: MarketGroup
) {
  return (
    (marketGroup.subjectType === "protocol" && marketGroup.subjectId === opportunity.protocolId) ||
    (marketGroup.subjectType === "asset" && marketGroup.subjectId === opportunity.assetId) ||
    (marketGroup.subjectType === "opportunity" && marketGroup.subjectId === opportunity.id)
  );
}

function sortMarketGroups(left: MarketGroup, right: MarketGroup) {
  const subjectOrder = {
    protocol: 0,
    asset: 1,
    opportunity: 2
  } as const;

  const subjectDifference = subjectOrder[left.subjectType] - subjectOrder[right.subjectType];
  if (subjectDifference !== 0) {
    return subjectDifference;
  }

  return left.id.localeCompare(right.id);
}

export function createRegistry(input: {
  protocols: Protocol[];
  assets: Asset[];
  opportunities: Opportunity[];
  relations: OverviewRelation[];
  marketGroups: MarketGroup[];
}): AppRegistry {
  assertUniqueIds(input.protocols, "protocol");
  assertUniqueIds(input.assets, "asset");
  assertUniqueIds(input.opportunities, "opportunity");
  assertUniqueRelations(input.relations);
  assertUniqueIds(input.marketGroups, "market group");

  const protocolMap = indexById(input.protocols);
  const assetMap = indexById(input.assets);
  const marketGroupMap = indexById(input.marketGroups);
  const outgoingRelationMap = new Map<string, OverviewRelation[]>();
  const incomingRelationMap = new Map<string, OverviewRelation[]>();

  for (const asset of input.assets) {
    if (!protocolMap.has(asset.protocolId)) {
      throw new Error(`Asset "${asset.id}" references missing protocol "${asset.protocolId}"`);
    }
  }

  for (const marketGroup of input.marketGroups) {
    const subjectFound =
      (marketGroup.subjectType === "protocol" && protocolMap.has(marketGroup.subjectId)) ||
      (marketGroup.subjectType === "asset" && assetMap.has(marketGroup.subjectId)) ||
      (marketGroup.subjectType === "opportunity" &&
        input.opportunities.some((opportunity) => opportunity.id === marketGroup.subjectId));

    if (!subjectFound) {
      throw new Error(
        `Market group "${marketGroup.id}" references missing ${marketGroup.subjectType} "${marketGroup.subjectId}"`
      );
    }
  }

  for (const relation of input.relations) {
    const fromExists =
      (relation.fromType === "protocol" && protocolMap.has(relation.fromId)) ||
      (relation.fromType === "asset" && assetMap.has(relation.fromId));
    const toExists =
      (relation.toType === "protocol" && protocolMap.has(relation.toId)) ||
      (relation.toType === "asset" && assetMap.has(relation.toId));

    if (!fromExists) {
      throw new Error(
        `Relation "${relation.relationType}" references missing ${relation.fromType} "${relation.fromId}"`
      );
    }

    if (!toExists) {
      throw new Error(`Relation "${relation.relationType}" references missing ${relation.toType} "${relation.toId}"`);
    }

    if (relation.opportunityId && !input.opportunities.some((opportunity) => opportunity.id === relation.opportunityId)) {
      throw new Error(
        `Relation "${relation.relationType}" references missing opportunity "${relation.opportunityId}"`
      );
    }

    const outgoingKey = getRelationEndpointKey(relation.fromType, relation.fromId);
    const incomingKey = getRelationEndpointKey(relation.toType, relation.toId);

    outgoingRelationMap.set(outgoingKey, [...(outgoingRelationMap.get(outgoingKey) ?? []), relation]);
    incomingRelationMap.set(incomingKey, [...(incomingRelationMap.get(incomingKey) ?? []), relation]);
  }

  const opportunities: EnrichedOpportunity[] = input.opportunities.map((opportunity) => {
    const protocol = protocolMap.get(opportunity.protocolId);
    const asset = assetMap.get(opportunity.assetId);
    const marketGroups = input.marketGroups.filter((marketGroup) => matchesSubject(opportunity, marketGroup)).sort(sortMarketGroups);

    if (!protocol) {
      throw new Error(`Opportunity "${opportunity.id}" references missing protocol "${opportunity.protocolId}"`);
    }

    if (!asset) {
      throw new Error(`Opportunity "${opportunity.id}" references missing asset "${opportunity.assetId}"`);
    }

    return {
      ...opportunity,
      protocol,
      asset,
      marketGroups
    };
  });

  return {
    protocols: input.protocols,
    assets: input.assets,
    opportunities,
    relations: input.relations,
    marketGroups: input.marketGroups,
    protocolMap,
    assetMap,
    marketGroupMap,
    opportunityMap: indexById(opportunities),
    outgoingRelationMap,
    incomingRelationMap
  };
}

let cachedRegistry: AppRegistry | undefined;

export function loadRegistry(): AppRegistry {
  if (!cachedRegistry) {
    cachedRegistry = createRegistry({
      protocols: protocolsJson as Protocol[],
      assets: assetsJson as Asset[],
      opportunities: opportunitiesJson as Opportunity[],
      relations: relationsJson as OverviewRelation[],
      marketGroups: marketGroupsJson as MarketGroup[]
    });
  }

  return cachedRegistry;
}
