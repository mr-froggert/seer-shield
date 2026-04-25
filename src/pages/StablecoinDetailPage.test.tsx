import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { StablecoinDetailPage } from "./StablecoinDetailPage";

vi.mock("../hooks/useTerminalData", () => ({
  useTerminalData: () => ({
    protocols: [
      {
        id: "aave",
        kind: "protocol" as const,
        name: "Aave",
        website: "https://aave.com",
        logoUrl: "/logos/test/aave.png",
        category: "Lending",
        chains: [1, 56],
        tags: ["platform"],
        description: "Aave protocol",
        status: "active" as const,
        assets: [],
        opportunities: [],
        marketGroups: [],
        protocolMetrics: null,
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 0.8,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
          signals: [],
          notes: []
        },
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1, 56],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null
      },
      {
        id: "spark",
        kind: "protocol" as const,
        name: "Spark",
        website: "https://spark.fi",
        logoUrl: "/logos/test/spark.png",
        category: "Lending",
        chains: [1],
        tags: ["platform"],
        description: "Spark protocol",
        status: "active" as const,
        assets: [],
        opportunities: [],
        marketGroups: [],
        protocolMetrics: null,
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 0,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "insufficient" as const,
          coverage: { configured: 1, priced: 0, unpriced: 1, resolved: 0, totalLiquidityUsd: 0 },
          signals: [],
          notes: ["No priced market"]
        },
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null
      },
      {
        id: "morpho",
        kind: "protocol" as const,
        name: "Morpho",
        website: "https://morpho.org",
        logoUrl: "/logos/test/morpho.png",
        category: "Lending",
        chains: [1],
        tags: ["platform"],
        description: "Morpho protocol",
        status: "active" as const,
        assets: [],
        opportunities: [],
        marketGroups: [],
        protocolMetrics: null,
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 1.4,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
          signals: [],
          notes: []
        },
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null
      }
    ],
    stablecoins: [
      {
        id: "usdt",
        kind: "stablecoin" as const,
        symbol: "USDT",
        name: "Tether USD",
        type: "stablecoin",
        protocolId: "tether",
        website: "https://tether.to/en/",
        coingeckoId: "tether",
        chains: [1, 10, 56, 43114],
        tags: ["stablecoin"],
        protocol: { id: "tether", name: "Tether" },
        issuerProtocol: { id: "tether", name: "Tether", website: "https://tether.to" },
        marketGroups: [],
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1, 10, 56, 43114],
        linkedOpportunityRoutes: [
          {
            opportunity: {
              id: "aave-usdt-eth",
              title: "Aave USDT on Ethereum",
              protocolId: "aave",
              assetId: "usdt",
              chainId: 1,
              category: "lending",
              tags: ["stablecoin"],
              yieldSource: "aave" as const,
              yieldSourceId: "reserve:eth",
              status: "active" as const,
              protocol: { id: "aave", name: "Aave" },
              asset: { id: "usdt", symbol: "USDT", name: "Tether USD", type: "stablecoin", tags: ["stablecoin"] },
              marketGroups: [],
              metrics: {
                source: "aave" as const,
                sourceId: "reserve:eth",
                grossApy: 13.3,
                apyBase: 13.3,
                apyReward: null,
                tvlUsd: null,
                rewardTokens: [],
                underlyingTokens: [],
                fetchedAt: "2026-01-01T00:00:00Z",
                warnings: [],
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=usdt-eth"
              },
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 7,
                expectedLossThroughExpiry: 1.2,
                riskAdjustedYieldThroughExpiry: 5.8,
                derived90dEquivalent: 2.61,
                confidence: "medium" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 13.3,
            expectedLossToHorizon: 1.2,
            netYieldToHorizon: 5.8,
            netYield90d: 2.61,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          },
          {
            opportunity: {
              id: "aave-usdt-bnb",
              title: "Aave USDT on BNB Chain",
              protocolId: "aave",
              assetId: "usdt",
              chainId: 56,
              category: "lending",
              tags: ["stablecoin"],
              yieldSource: "aave" as const,
              yieldSourceId: "reserve:bnb",
              status: "active" as const,
              protocol: { id: "aave", name: "Aave" },
              asset: { id: "usdt", symbol: "USDT", name: "Tether USD", type: "stablecoin", tags: ["stablecoin"] },
              marketGroups: [],
              metrics: {
                source: "aave" as const,
                sourceId: "reserve:bnb",
                grossApy: 4.36,
                apyBase: 4.36,
                apyReward: null,
                tvlUsd: null,
                rewardTokens: [],
                underlyingTokens: [],
                fetchedAt: "2026-01-01T00:00:00Z",
                warnings: [],
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=usdt-bnb"
              },
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 3,
                expectedLossThroughExpiry: 1.2,
                riskAdjustedYieldThroughExpiry: 1.8,
                derived90dEquivalent: 0.81,
                confidence: "medium" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 4.36,
            expectedLossToHorizon: 1.2,
            netYieldToHorizon: 1.8,
            netYield90d: 0.81,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          },
          {
            opportunity: {
              id: "spark-usdt",
              title: "Spark USDT on Ethereum",
              protocolId: "spark",
              assetId: "usdt",
              chainId: 1,
              category: "lending",
              tags: ["stablecoin"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-spark",
              status: "active" as const,
              protocol: { id: "spark", name: "Spark" },
              asset: { id: "usdt", symbol: "USDT", name: "Tether USD", type: "stablecoin", tags: ["stablecoin"] },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "pool-spark",
                grossApy: 7.1,
                apyBase: 7.1,
                apyReward: null,
                tvlUsd: null,
                rewardTokens: [],
                underlyingTokens: [],
                fetchedAt: "2026-01-01T00:00:00Z",
                warnings: [],
                url: "https://app.spark.fi"
              },
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 4,
                expectedLossThroughExpiry: 0,
                riskAdjustedYieldThroughExpiry: 4,
                derived90dEquivalent: 1.8,
                confidence: "insufficient" as const,
                coverage: { configured: 1, priced: 0, unpriced: 1, resolved: 0, totalLiquidityUsd: 0 },
                signals: [],
                notes: []
              }
            },
            grossApy: 7.1,
            expectedLossToHorizon: 0,
            netYieldToHorizon: 4,
            netYield90d: 1.8,
            confidence: "insufficient" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: false
          },
          {
            opportunity: {
              id: "morpho-usdt",
              title: "Morpho USDT on Ethereum",
              protocolId: "morpho",
              assetId: "usdt",
              chainId: 1,
              category: "lending",
              tags: ["stablecoin"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-x",
              status: "active" as const,
              protocol: { id: "morpho", name: "Morpho" },
              asset: { id: "usdt", symbol: "USDT", name: "Tether USD", type: "stablecoin", tags: ["stablecoin"] },
              marketGroups: [],
              metrics: null,
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 4,
                expectedLossThroughExpiry: 1.1,
                riskAdjustedYieldThroughExpiry: 2.9,
                derived90dEquivalent: 1.31,
                confidence: "medium" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 5.5,
            expectedLossToHorizon: 1.1,
            netYieldToHorizon: 2.9,
            netYield90d: 1.31,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          }
        ],
        bestEligibleOpportunity: null,
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 2,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
          signals: [
            {
              kind: "depeg" as const,
              label: "USDT trades below $0.98",
              marketName: "USDT depeg",
              marketType: "categorical" as const,
              horizonEnd: "2026-12-31T23:59:59Z",
              probability: 0.05,
              probabilitySource: "seer" as const,
              resolvedValue: null,
              expectedLoss: 2,
              liquidityUsd: 1000,
              status: "OPEN",
              odds: [0.95, 0.05],
              severity: 1,
              marketSyncStatus: "created" as const,
              url: "https://seer.pm/markets/usdt-depeg"
            }
          ],
          notes: []
        }
      }
    ]
  })
}));

describe("StablecoinDetailPage", () => {
  it("collapses multi-chain routes into a single protocol row with ranges", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter initialEntries={["/stablecoins/usdt"]}>
        <Routes>
          <Route path="/stablecoins/:id" element={<StablecoinDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Routes for USDT")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Platform" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tether" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://tether.to/en/");
    expect(screen.getByRole("link", { name: "DefiLlama" })).toHaveAttribute("href", "https://defillama.com/yields?symbol=USDT");
    expect(screen.getByRole("link", { name: "CoinGecko" })).toHaveAttribute("href", "https://www.coingecko.com/en/coins/tether");
    expect(screen.queryByText(/Risk summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Issuer context/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Issuer$/)).not.toBeInTheDocument();
    expect(screen.getByText("Observed chains")).toBeInTheDocument();
    expect(screen.getByText("Ethereum, Optimism, BNB Chain, Avalanche")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trade on Seer" })).toHaveAttribute("href", "https://seer.pm/markets/usdt-depeg");
    const highestApyCard = screen.getAllByText("Highest APY route")[0]?.closest(".summary-card");
    expect(highestApyCard).not.toBeNull();
    expect(within(highestApyCard as HTMLElement).getByRole("link", { name: "Aave USDT on Ethereum" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=usdt-eth"
    );
    expect(screen.getAllByRole("link", { name: "Aave" })).toHaveLength(1);
    const routeTable = screen.getByRole("table");
    expect(container.querySelector('img[src="/logos/test/aave.png"]')).not.toBeNull();
    expect(container.querySelector('img[src="/logos/test/morpho.png"]')).not.toBeNull();
    expect(within(routeTable).getByText("Unpriced")).toBeInTheDocument();
    expect(within(routeTable).getByText("0.80%")).toBeInTheDocument();
    expect(within(routeTable).getByText("4.36% - 13.30%")).toBeInTheDocument();
    expect(within(routeTable).getByText("Ethereum, BNB Chain")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /All chains/i }));
    await user.click(screen.getByLabelText("BNB Chain"));

    expect(within(routeTable).getAllByText("4.36%").length).toBeGreaterThan(0);
    expect(within(routeTable).getByText("BNB Chain")).toBeInTheDocument();
    expect(within(routeTable).getByRole("link", { name: "Aave USDT on BNB Chain" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=usdt-bnb"
    );
  });
});
