import type { MarketStatus } from "@seer-pm/sdk/market-types";

export type EntityStatus = "active" | "paused" | "archived";
export type YieldSource = "defillama" | "aave";
export type SubjectType = "protocol" | "asset" | "opportunity";
export type AssetOverviewKind = "stablecoin" | "tokenized-btc" | "core-asset";
export type OverviewRelationEndpointType = "protocol" | "asset";
export type OverviewRelationType =
  | "supports_yield_for"
  | "yield_available_on"
  | "associated_asset"
  | "associated_protocol";
export type RiskSignalKind = "exploit" | "depeg" | "freeze" | "haircut";
export type RiskMarketType = "categorical" | "scalar";
export type ConfidenceBucket = "high" | "medium" | "low" | "insufficient";
export type ProbabilitySource = "seer" | "none";
export type RiskMarketSyncStatus = "created" | "missing" | "pending";

export interface RiskAdjustedApyPreferences {
  enabled: boolean;
  assetDepegRecoverablePercent: number;
  platformExploitRecoverablePercent: number;
}

export interface Protocol {
  id: string;
  name: string;
  website: string;
  logoUrl?: string;
  category: string;
  chains: number[];
  tags: string[];
  description: string;
  status: EntityStatus;
  defillamaProjectId?: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  protocolId: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  chains: number[];
  tags: string[];
  coingeckoId?: string;
  yieldDiscoverySymbol?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  protocolId: string;
  assetId: string;
  chainId: number;
  category: string;
  tags: string[];
  summary?: string;
  yieldSource: YieldSource;
  yieldSourceId: string;
  underlyingYieldSourceIds?: string[];
  status: EntityStatus;
}

export interface OverviewRelation {
  fromType: OverviewRelationEndpointType;
  fromId: string;
  toType: OverviewRelationEndpointType;
  toId: string;
  relationType: OverviewRelationType;
  opportunityId?: string;
  label?: string;
  chainIds?: number[];
  priority?: number;
}

export interface RiskMarketSeedDefinition {
  question: string;
  openingTime: string;
  chainId?: number;
  category?: string;
  marketType: RiskMarketType;
  outcomes?: string[];
  lowerBound?: string;
  upperBound?: string;
  unit?: string;
  minBondWei?: string;
}

export interface MarketCreationMetadata {
  status: RiskMarketSyncStatus;
  chainId: number;
  url?: string;
  lastSyncedAt?: string;
}

export interface ConfiguredRiskMarket {
  id: string;
  label: string;
  kind: RiskSignalKind;
  type: RiskMarketType;
  severity: number;
  notes?: string;
  seerMarketId?: `0x${string}`;
  creation?: MarketCreationMetadata;
  seed?: RiskMarketSeedDefinition;
}

export interface MarketGroup {
  id: string;
  subjectType: SubjectType;
  subjectId: string;
  horizonLabel: string;
  horizonEnd: string;
  notes?: string;
  markets: ConfiguredRiskMarket[];
}

export interface OpportunityMetrics {
  source: YieldSource;
  sourceId: string;
  label?: string;
  grossApy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  tvlUsd: number | null;
  rewardTokens: string[];
  underlyingTokens: string[];
  fetchedAt: string;
  url?: string;
  warnings: string[];
  components?: YieldComponentMetrics[];
}

export interface YieldComponentMetrics {
  role: "route" | "underlying";
  source: YieldSource;
  sourceId: string;
  label: string;
  grossApy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  tvlUsd: number | null;
  url?: string;
}

export interface ProtocolMetrics {
  source: YieldSource;
  sourceId: string;
  minApy: number | null;
  maxApy: number | null;
  totalTvlUsd: number | null;
  poolsCount: number;
  fetchedAt: string;
  url?: string;
  warnings: string[];
}

export interface RiskSignal {
  kind: RiskSignalKind;
  label: string;
  marketId?: `0x${string}`;
  marketName: string;
  marketType: RiskMarketType;
  horizonEnd: string;
  probability: number | null;
  probabilitySource: ProbabilitySource;
  resolvedValue: number | null;
  expectedLoss: number | null;
  liquidityUsd: number;
  status: MarketStatus | "unavailable";
  odds: number[];
  severity: number;
  marketSyncStatus: RiskMarketSyncStatus;
  notes?: string;
  url?: string;
}

export interface RiskProfileCoverage {
  configured: number;
  priced: number;
  unpriced: number;
  resolved: number;
  totalLiquidityUsd: number;
}

export interface RiskProfile {
  horizonEnd: string | null;
  horizonDays: number | null;
  grossYieldThroughExpiry: number | null;
  expectedLossThroughExpiry: number | null;
  riskAdjustedYieldThroughExpiry: number | null;
  derived90dEquivalent: number | null;
  confidence: ConfidenceBucket;
  coverage: RiskProfileCoverage;
  signals: RiskSignal[];
  notes: string[];
}

export interface EnrichedOpportunity extends Opportunity {
  protocol: Protocol;
  asset: Asset;
  marketGroups: MarketGroup[];
}

export interface OpportunityViewModel extends EnrichedOpportunity {
  metrics: OpportunityMetrics | null;
  riskProfile: RiskProfile;
}

export interface LinkedMarketView {
  subjectType: SubjectType;
  subjectId: string;
  subjectLabel: string;
  opportunityIds: string[];
  opportunityTitles: string[];
  marketGroupId: string;
  marketGroupLabel: string;
  signal: RiskSignal;
}

export interface ProtocolViewModel extends Protocol {
  assets: Asset[];
  opportunities: OpportunityViewModel[];
  marketGroups: MarketGroup[];
  protocolMetrics: ProtocolMetrics | null;
  riskProfile: RiskProfile;
  linkedMarkets: LinkedMarketView[];
}

export interface AssetViewModel extends Asset {
  protocol: Protocol;
  marketGroups: MarketGroup[];
  riskProfile: RiskProfile;
  linkedMarkets: LinkedMarketView[];
}

export interface OverviewYieldRelationship {
  id: string;
  relationType: OverviewRelationType;
  protocol: Protocol;
  asset: Asset;
  opportunity: OpportunityViewModel | null;
  chainIds: number[];
  label?: string;
  priority?: number;
}

export interface OpportunityRouteSummary {
  opportunity: OpportunityViewModel;
  grossApy: number | null;
  adjustedApy?: number | null;
  displayApy?: number | null;
  expectedLossToHorizon: number | null;
  netYieldToHorizon: number | null;
  netYield90d: number | null;
  confidence: ConfidenceBucket;
  horizonEnd: string | null;
  horizonDays: number | null;
  isEligible: boolean;
}

export interface ProtocolOverviewViewModel extends ProtocolViewModel {
  kind: "protocol";
  yieldRelationships: OverviewYieldRelationship[];
  overviewChains: number[];
  linkedOpportunityRoutes: OpportunityRouteSummary[];
  bestEligibleOpportunity: OpportunityRouteSummary | null;
}

export interface YieldAssetOverviewViewModel extends AssetViewModel {
  kind: AssetOverviewKind;
  yieldRelationships: OverviewYieldRelationship[];
  overviewChains: number[];
  linkedOpportunityRoutes: OpportunityRouteSummary[];
  bestEligibleOpportunity: OpportunityRouteSummary | null;
}

export interface PeggedAssetOverviewViewModel extends YieldAssetOverviewViewModel {
  issuerProtocol: Protocol;
}

export interface StablecoinOverviewViewModel extends PeggedAssetOverviewViewModel {
  kind: "stablecoin";
}

export interface TokenizedBtcOverviewViewModel extends PeggedAssetOverviewViewModel {
  kind: "tokenized-btc";
}

export interface CoreAssetOverviewViewModel extends YieldAssetOverviewViewModel {
  kind: "core-asset";
}

export interface AppRegistry {
  protocols: Protocol[];
  assets: Asset[];
  opportunities: EnrichedOpportunity[];
  relations: OverviewRelation[];
  marketGroups: MarketGroup[];
  protocolMap: Map<string, Protocol>;
  assetMap: Map<string, Asset>;
  opportunityMap: Map<string, EnrichedOpportunity>;
  marketGroupMap: Map<string, MarketGroup>;
  outgoingRelationMap: Map<string, OverviewRelation[]>;
  incomingRelationMap: Map<string, OverviewRelation[]>;
}
