import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const missingStablecoinSignal = {
  kind: "depeg" as const,
  label: "USDC trades below $0.98",
  marketName: "Will USDC trade below 0.98 USD at any point before December 31, 2026?",
  marketType: "categorical" as const,
  horizonEnd: "2026-12-31T23:59:59Z",
  probability: null,
  probabilitySource: "none" as const,
  resolvedValue: null,
  expectedLoss: null,
  liquidityUsd: 0,
  status: "unavailable" as const,
  odds: [],
  severity: 1,
  marketSyncStatus: "missing" as const,
  notes: "Stablecoin depeg question seeded for creation."
};

const missingWrappedBtcSignal = {
  kind: "depeg" as const,
  label: "cbBTC trades below 0.98 BTC",
  marketName: "Will cbBTC trade below 0.98 BTC at any point before December 31, 2026?",
  marketType: "categorical" as const,
  horizonEnd: "2026-12-31T23:59:59Z",
  probability: null,
  probabilitySource: "none" as const,
  resolvedValue: null,
  expectedLoss: null,
  liquidityUsd: 0,
  status: "unavailable" as const,
  odds: [],
  severity: 1,
  marketSyncStatus: "missing" as const,
  notes: "BTC wrapper depeg question seeded for creation."
};

const aaveProtocol = {
  id: "aave",
  name: "Aave",
  website: "https://aave.com",
  category: "lending",
  chains: [1],
  tags: ["lending", "platform-surface"],
  description: "Money market",
  status: "active" as const,
  defillamaProjectId: "aave-v3"
};

const ghoAsset = {
  id: "gho",
  symbol: "GHO",
  name: "Aave GHO",
  type: "stablecoin",
  protocolId: "aave",
  chains: [1],
  tags: ["stablecoin"]
};

const cbbtcAsset = {
  id: "cbbtc",
  symbol: "cbBTC",
  name: "Coinbase Wrapped BTC",
  type: "tokenized-btc",
  protocolId: "coinbase",
  chains: [1, 8453, 42161],
  tags: ["tokenized-btc"]
};

const ethAsset = {
  id: "eth",
  symbol: "ETH",
  name: "Ether",
  type: "core-asset",
  protocolId: "ethereum",
  chains: [1],
  tags: ["core-asset"]
};

const ghoOpportunity = {
  id: "aave-gho-eth",
  title: "Aave GHO Savings on Ethereum",
  protocolId: "aave",
  assetId: "gho",
  chainId: 1,
  category: "stablecoin",
  tags: ["aave", "stablecoin"],
  summary: "GHO supplied into the Aave savings path.",
  yieldSource: "defillama" as const,
  yieldSourceId: "pool-gho",
  status: "active" as const,
  protocol: aaveProtocol,
  asset: ghoAsset,
  marketGroups: [],
  metrics: {
    source: "defillama" as const,
    sourceId: "pool-gho",
    grossApy: 5.51,
    apyBase: 5.4,
    apyReward: 0.11,
    tvlUsd: 209304528,
    rewardTokens: [],
    underlyingTokens: [],
    fetchedAt: new Date().toISOString(),
    warnings: []
  },
  riskProfile: {
    horizonEnd: "2026-12-31T23:59:59Z",
    horizonDays: 200,
    grossYieldThroughExpiry: 3.02,
    expectedLossThroughExpiry: null,
    riskAdjustedYieldThroughExpiry: null,
    derived90dEquivalent: null,
    confidence: "insufficient" as const,
    coverage: {
      configured: 0,
      priced: 0,
      unpriced: 0,
      resolved: 0,
      totalLiquidityUsd: 0
    },
    signals: [],
    notes: []
  }
};

const cbbtcOpportunity = {
  id: "aave-cbbtc-base",
  title: "Aave cbBTC on Base",
  protocolId: "aave",
  assetId: "cbbtc",
  chainId: 8453,
  category: "lending",
  tags: ["aave", "tokenized-btc"],
  summary: "cbBTC supplied into Aave on Base.",
  yieldSource: "defillama" as const,
  yieldSourceId: "pool-cbbtc-base",
  status: "active" as const,
  protocol: aaveProtocol,
  asset: cbbtcAsset,
  marketGroups: [],
  metrics: {
    source: "defillama" as const,
    sourceId: "pool-cbbtc-base",
    grossApy: 2.01,
    apyBase: 2.01,
    apyReward: 0,
    tvlUsd: 156127640,
    rewardTokens: [],
    underlyingTokens: [],
    fetchedAt: new Date().toISOString(),
    warnings: []
  },
  riskProfile: {
    horizonEnd: "2026-12-31T23:59:59Z",
    horizonDays: 200,
    grossYieldThroughExpiry: 1.1,
    expectedLossThroughExpiry: null,
    riskAdjustedYieldThroughExpiry: null,
    derived90dEquivalent: null,
    confidence: "insufficient" as const,
    coverage: {
      configured: 0,
      priced: 0,
      unpriced: 0,
      resolved: 0,
      totalLiquidityUsd: 0
    },
    signals: [],
    notes: []
  }
};

const aaveEthOpportunity = {
  id: "aave-eth-eth",
  title: "Aave ETH on Ethereum",
  protocolId: "aave",
  assetId: "eth",
  chainId: 1,
  category: "lending",
  tags: ["aave", "core-asset"],
  summary: "ETH supplied into Aave on Ethereum.",
  yieldSource: "defillama" as const,
  yieldSourceId: "pool-eth",
  status: "active" as const,
  protocol: aaveProtocol,
  asset: ethAsset,
  marketGroups: [],
  metrics: {
    source: "defillama" as const,
    sourceId: "pool-eth",
    grossApy: 3.65,
    apyBase: 3.65,
    apyReward: 0,
    tvlUsd: 510000000,
    rewardTokens: [],
    underlyingTokens: [],
    fetchedAt: new Date().toISOString(),
    warnings: []
  },
  riskProfile: {
    horizonEnd: "2026-12-31T23:59:59Z",
    horizonDays: 200,
    grossYieldThroughExpiry: 2,
    expectedLossThroughExpiry: 0.4,
    riskAdjustedYieldThroughExpiry: 1.6,
    derived90dEquivalent: 0.72,
    confidence: "medium" as const,
    coverage: {
      configured: 0,
      priced: 0,
      unpriced: 0,
      resolved: 0,
      totalLiquidityUsd: 0
    },
    signals: [],
    notes: []
  }
};

vi.mock("./hooks/useTerminalData", () => ({
  useTerminalData: () => ({
    isLoading: false,
    error: null,
    opportunities: [ghoOpportunity, cbbtcOpportunity, aaveEthOpportunity],
    linkedMarkets: [
      {
        subjectType: "asset" as const,
        subjectId: "usdc",
        subjectLabel: "USDC",
        opportunityIds: [],
        opportunityTitles: [],
        marketGroupId: "usdc-depeg-risk",
        marketGroupLabel: "Through Dec 31, 2026",
        signal: missingStablecoinSignal
      },
      {
        subjectType: "asset" as const,
        subjectId: "cbbtc",
        subjectLabel: "cbBTC",
        opportunityIds: ["aave-cbbtc-base"],
        opportunityTitles: ["Aave cbBTC on Base"],
        marketGroupId: "cbbtc-peg-risk",
        marketGroupLabel: "Through Dec 31, 2026",
        signal: missingWrappedBtcSignal
      }
    ],
    protocols: [
      {
        ...aaveProtocol,
        kind: "protocol" as const,
        assets: [ghoAsset, cbbtcAsset],
        opportunities: [ghoOpportunity, cbbtcOpportunity],
        protocolMetrics: {
          source: "defillama" as const,
          sourceId: "aave-v3",
          minApy: 0,
          maxApy: 5.25,
          totalTvlUsd: 8_250_000_000,
          poolsCount: 42,
          fetchedAt: new Date().toISOString(),
          warnings: []
        },
        marketGroups: [],
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: null,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "insufficient" as const,
          coverage: {
            configured: 0,
            priced: 0,
            unpriced: 0,
            resolved: 0,
            totalLiquidityUsd: 0
          },
          signals: [],
          notes: []
        },
        linkedMarkets: [],
        yieldRelationships: [
          {
            id: "supports_yield_for:aave:gho:aave-gho-eth",
            relationType: "supports_yield_for" as const,
            protocol: aaveProtocol,
            asset: ghoAsset,
            opportunity: ghoOpportunity,
            chainIds: [1],
            label: "sGHO savings route",
            priority: 1
          },
          {
            id: "supports_yield_for:aave:cbbtc:aave-cbbtc-base",
            relationType: "supports_yield_for" as const,
            protocol: aaveProtocol,
            asset: cbbtcAsset,
            opportunity: cbbtcOpportunity,
            chainIds: [8453],
            label: "cbBTC market",
            priority: 2
          }
        ],
        overviewChains: [1],
        linkedOpportunityRoutes: [
          {
            opportunity: ghoOpportunity,
            grossApy: ghoOpportunity.metrics.grossApy,
            expectedLossToHorizon: ghoOpportunity.riskProfile.expectedLossThroughExpiry,
            netYieldToHorizon: ghoOpportunity.riskProfile.riskAdjustedYieldThroughExpiry,
            netYield90d: ghoOpportunity.riskProfile.derived90dEquivalent,
            confidence: ghoOpportunity.riskProfile.confidence,
            horizonEnd: ghoOpportunity.riskProfile.horizonEnd,
            horizonDays: ghoOpportunity.riskProfile.horizonDays,
            isEligible: false
          },
          {
            opportunity: cbbtcOpportunity,
            grossApy: cbbtcOpportunity.metrics.grossApy,
            expectedLossToHorizon: cbbtcOpportunity.riskProfile.expectedLossThroughExpiry,
            netYieldToHorizon: cbbtcOpportunity.riskProfile.riskAdjustedYieldThroughExpiry,
            netYield90d: cbbtcOpportunity.riskProfile.derived90dEquivalent,
            confidence: cbbtcOpportunity.riskProfile.confidence,
            horizonEnd: cbbtcOpportunity.riskProfile.horizonEnd,
            horizonDays: cbbtcOpportunity.riskProfile.horizonDays,
            isEligible: false
          }
        ],
        bestEligibleOpportunity: null
      }
    ],
    stablecoins: [
      {
        ...ghoAsset,
        kind: "stablecoin" as const,
        protocol: aaveProtocol,
        issuerProtocol: aaveProtocol,
        marketGroups: [
          {
            id: "gho-depeg-risk",
            subjectType: "asset" as const,
            subjectId: "gho",
            horizonLabel: "Through Dec 31, 2026",
            horizonEnd: "2026-12-31T23:59:59Z",
            markets: []
          }
        ],
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: null,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "insufficient" as const,
          coverage: {
            configured: 1,
            priced: 0,
            unpriced: 1,
            resolved: 0,
            totalLiquidityUsd: 0
          },
          signals: [missingStablecoinSignal],
          notes: ["Confidence is insufficient because none of the linked markets currently expose usable odds."]
        },
        linkedMarkets: [
          {
            subjectType: "asset" as const,
            subjectId: "gho",
            subjectLabel: "GHO",
            opportunityIds: ["aave-gho-eth"],
            opportunityTitles: ["Aave GHO Savings on Ethereum"],
            marketGroupId: "gho-depeg-risk",
            marketGroupLabel: "Through Dec 31, 2026",
            signal: missingStablecoinSignal
          }
        ],
        yieldRelationships: [
          {
            id: "yield_available_on:aave:gho:aave-gho-eth",
            relationType: "yield_available_on" as const,
            protocol: aaveProtocol,
            asset: ghoAsset,
            opportunity: ghoOpportunity,
            chainIds: [1],
            label: "sGHO savings route",
            priority: 1
          }
        ],
        overviewChains: [1],
        linkedOpportunityRoutes: [
          {
            opportunity: ghoOpportunity,
            grossApy: ghoOpportunity.metrics.grossApy,
            expectedLossToHorizon: ghoOpportunity.riskProfile.expectedLossThroughExpiry,
            netYieldToHorizon: ghoOpportunity.riskProfile.riskAdjustedYieldThroughExpiry,
            netYield90d: ghoOpportunity.riskProfile.derived90dEquivalent,
            confidence: ghoOpportunity.riskProfile.confidence,
            horizonEnd: ghoOpportunity.riskProfile.horizonEnd,
            horizonDays: ghoOpportunity.riskProfile.horizonDays,
            isEligible: false
          }
        ],
        bestEligibleOpportunity: null
      },
      {
        id: "usdc",
        symbol: "USDC",
        name: "USD Coin",
        type: "stablecoin",
        protocolId: "circle",
        chains: [1],
        tags: ["stablecoin"],
        protocol: {
          id: "circle",
          name: "Circle",
          website: "https://www.circle.com",
          category: "stablecoin",
          chains: [1],
          tags: ["stablecoin"],
          description: "Stablecoin issuer",
          status: "active" as const
        },
        marketGroups: [
          {
            id: "usdc-depeg-risk",
            subjectType: "asset" as const,
            subjectId: "usdc",
            horizonLabel: "Through Dec 31, 2026",
            horizonEnd: "2026-12-31T23:59:59Z",
            markets: []
          }
        ],
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: null,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "insufficient" as const,
          coverage: {
            configured: 1,
            priced: 0,
            unpriced: 1,
            resolved: 0,
            totalLiquidityUsd: 0
          },
          signals: [missingStablecoinSignal],
          notes: ["Confidence is insufficient because none of the linked markets currently expose usable odds."]
        },
        linkedMarkets: [
          {
            subjectType: "asset" as const,
            subjectId: "usdc",
            subjectLabel: "USDC",
            opportunityIds: [],
            opportunityTitles: [],
            marketGroupId: "usdc-depeg-risk",
            marketGroupLabel: "Through Dec 31, 2026",
            signal: missingStablecoinSignal
          }
        ],
        kind: "stablecoin" as const,
        issuerProtocol: {
          id: "circle",
          name: "Circle",
          website: "https://www.circle.com",
          category: "stablecoin",
          chains: [1],
          tags: ["stablecoin"],
          description: "Stablecoin issuer",
          status: "active" as const
        },
        yieldRelationships: [],
        overviewChains: [1],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null
      }
    ],
    tokenizedBtc: [
      {
        ...cbbtcAsset,
        kind: "tokenized-btc" as const,
        protocol: {
          id: "coinbase",
          name: "Coinbase",
          website: "https://www.coinbase.com/cbbtc",
          category: "wrapped-btc",
          chains: [1, 8453, 42161],
          tags: ["wrapped-btc"],
          description: "cbBTC issuer",
          status: "active" as const
        },
        issuerProtocol: {
          id: "coinbase",
          name: "Coinbase",
          website: "https://www.coinbase.com/cbbtc",
          category: "wrapped-btc",
          chains: [1, 8453, 42161],
          tags: ["wrapped-btc"],
          description: "cbBTC issuer",
          status: "active" as const
        },
        marketGroups: [
          {
            id: "cbbtc-peg-risk",
            subjectType: "asset" as const,
            subjectId: "cbbtc",
            horizonLabel: "Through Dec 31, 2026",
            horizonEnd: "2026-12-31T23:59:59Z",
            markets: []
          }
        ],
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: null,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "insufficient" as const,
          coverage: {
            configured: 1,
            priced: 0,
            unpriced: 1,
            resolved: 0,
            totalLiquidityUsd: 0
          },
          signals: [missingWrappedBtcSignal],
          notes: ["Confidence is insufficient because none of the linked markets currently expose usable odds."]
        },
        linkedMarkets: [
          {
            subjectType: "asset" as const,
            subjectId: "cbbtc",
            subjectLabel: "cbBTC",
            opportunityIds: ["aave-cbbtc-base"],
            opportunityTitles: ["Aave cbBTC on Base"],
            marketGroupId: "cbbtc-peg-risk",
            marketGroupLabel: "Through Dec 31, 2026",
            signal: missingWrappedBtcSignal
          }
        ],
        yieldRelationships: [
          {
            id: "yield_available_on:aave:cbbtc:aave-cbbtc-base",
            relationType: "yield_available_on" as const,
            protocol: aaveProtocol,
            asset: cbbtcAsset,
            opportunity: cbbtcOpportunity,
            chainIds: [8453],
            label: "cbBTC market",
            priority: 1
          }
        ],
        overviewChains: [1, 8453, 42161],
        linkedOpportunityRoutes: [
          {
            opportunity: cbbtcOpportunity,
            grossApy: cbbtcOpportunity.metrics.grossApy,
            expectedLossToHorizon: cbbtcOpportunity.riskProfile.expectedLossThroughExpiry,
            netYieldToHorizon: cbbtcOpportunity.riskProfile.riskAdjustedYieldThroughExpiry,
            netYield90d: cbbtcOpportunity.riskProfile.derived90dEquivalent,
            confidence: cbbtcOpportunity.riskProfile.confidence,
            horizonEnd: cbbtcOpportunity.riskProfile.horizonEnd,
            horizonDays: cbbtcOpportunity.riskProfile.horizonDays,
            isEligible: false
          }
        ],
        bestEligibleOpportunity: null
      }
    ],
    coreAssets: [
      {
        ...ethAsset,
        kind: "core-asset" as const,
        protocol: {
          id: "ethereum",
          name: "Ethereum",
          website: "https://ethereum.org",
          category: "base-asset",
          chains: [1],
          tags: ["core-asset"],
          description: "Native Ethereum asset",
          status: "active" as const
        },
        marketGroups: [],
        linkedMarkets: [],
        riskProfile: {
          horizonEnd: null,
          horizonDays: null,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: null,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "insufficient" as const,
          coverage: {
            configured: 0,
            priced: 0,
            unpriced: 0,
            resolved: 0,
            totalLiquidityUsd: 0
          },
          signals: [],
          notes: ["Core assets do not carry intrinsic depeg-style pricing in this view."]
        },
        yieldRelationships: [
          {
            id: "supports_yield_for:aave:eth:aave-eth-eth",
            relationType: "supports_yield_for" as const,
            protocol: aaveProtocol,
            asset: ethAsset,
            opportunity: aaveEthOpportunity,
            chainIds: [1],
            label: "Aave ETH market",
            priority: 1
          }
        ],
        overviewChains: [1],
        linkedOpportunityRoutes: [
          {
            opportunity: aaveEthOpportunity,
            grossApy: aaveEthOpportunity.metrics.grossApy,
            expectedLossToHorizon: aaveEthOpportunity.riskProfile.expectedLossThroughExpiry,
            netYieldToHorizon: aaveEthOpportunity.riskProfile.riskAdjustedYieldThroughExpiry,
            netYield90d: aaveEthOpportunity.riskProfile.derived90dEquivalent,
            confidence: aaveEthOpportunity.riskProfile.confidence,
            horizonEnd: aaveEthOpportunity.riskProfile.horizonEnd,
            horizonDays: aaveEthOpportunity.riskProfile.horizonDays,
            isEligible: true
          }
        ],
        bestEligibleOpportunity: {
          opportunity: aaveEthOpportunity,
          grossApy: aaveEthOpportunity.metrics.grossApy,
          expectedLossToHorizon: aaveEthOpportunity.riskProfile.expectedLossThroughExpiry,
          netYieldToHorizon: aaveEthOpportunity.riskProfile.riskAdjustedYieldThroughExpiry,
          netYield90d: aaveEthOpportunity.riskProfile.derived90dEquivalent,
          confidence: aaveEthOpportunity.riskProfile.confidence,
          horizonEnd: aaveEthOpportunity.riskProfile.horizonEnd,
          horizonDays: aaveEthOpportunity.riskProfile.horizonDays,
          isEligible: true
        }
      }
    ]
  })
}));

import { appRoutes } from "./App";

function renderRoute(path: string) {
  const queryClient = new QueryClient();
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path]
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

describe("routes", () => {
  it("renders the protocol dashboard", async () => {
    renderRoute("/");
    expect(await screen.findByText("Platform Safety")).toBeInTheDocument();
    expect(screen.getAllByText("Platforms").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Aave").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$8.25B").length).toBeGreaterThan(0);
  });

  it("renders the stablecoins page", async () => {
    renderRoute("/stablecoins");
    expect(await screen.findByText("Stablecoin Safety")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by")).toHaveValue("safety");
    expect(screen.getByRole("button", { name: /All chains/i })).toBeInTheDocument();
  });

  it("renders the core assets page", async () => {
    renderRoute("/core-assets");
    expect(await screen.findByText("Core Asset APY")).toBeInTheDocument();
    expect(screen.getAllByText("ETH").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Sort by")).toHaveValue("apy");
    expect(screen.getByRole("button", { name: /All chains/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ETH" })).toHaveAttribute("href", "/core-assets/eth");
  });

  it("renders the tokenized BTC page", async () => {
    renderRoute("/tokenized-btc");
    expect(await screen.findByText("BTC Wrapper Safety")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "cbBTC" })).toHaveAttribute("href", "/tokenized-btc/cbbtc");
    expect(screen.getByText("Supported chains")).toBeInTheDocument();
  });

  it("treats removed opportunity routes as unknown paths", async () => {
    renderRoute("/opportunities/removed-route");
    expect(await screen.findByText("Unknown route.")).toBeInTheDocument();
  });

  it("renders the protocol detail page", async () => {
    renderRoute("/protocols/aave");
    expect(await screen.findByRole("heading", { name: "Aave" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Routes by asset" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GHO" })).toHaveAttribute("href", "/stablecoins/gho");
    expect(screen.getByRole("link", { name: "cbBTC" })).toHaveAttribute("href", "/tokenized-btc/cbbtc");
  });

  it("renders the stablecoin detail page and links back to protocols", async () => {
    renderRoute("/stablecoins/gho");
    expect(await screen.findByRole("heading", { name: "GHO" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Routes for GHO" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Aave" })[0]).toHaveAttribute("href", "/protocols/aave");
  });

  it("renders the core asset detail page", async () => {
    renderRoute("/core-assets/eth");
    expect(await screen.findByRole("heading", { name: "ETH" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Routes for ETH" })).toBeInTheDocument();
    expect(screen.getAllByText("Ethereum").length).toBeGreaterThan(0);
  });

  it("navigates from the core assets table into the detail page", async () => {
    const user = userEvent.setup();
    renderRoute("/core-assets");
    await user.click(await screen.findByRole("link", { name: "ETH" }));
    expect(await screen.findByRole("heading", { name: "ETH" })).toBeInTheDocument();
  });

  it("navigates from the stablecoin table into the new detail page", async () => {
    const user = userEvent.setup();
    renderRoute("/stablecoins");
    await user.click(await screen.findByRole("link", { name: "GHO" }));
    expect(await screen.findByRole("heading", { name: "GHO" })).toBeInTheDocument();
  });

  it("renders the tokenized BTC detail page", async () => {
    renderRoute("/tokenized-btc/cbbtc");
    expect(await screen.findByRole("heading", { name: "cbBTC" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Routes for cbBTC" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://www.coinbase.com/cbbtc");
  });
});
