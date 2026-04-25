import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TokenizedBtcDetailPage } from "./TokenizedBtcDetailPage";

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
        chains: [1, 8453],
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
          expectedLossThroughExpiry: 0.6,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
          signals: [],
          notes: []
        },
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1, 8453],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null
      },
      {
        id: "compound",
        kind: "protocol" as const,
        name: "Compound",
        website: "https://compound.finance",
        logoUrl: "/logos/test/compound.png",
        category: "Lending",
        chains: [8453],
        tags: ["platform"],
        description: "Compound protocol",
        status: "active" as const,
        assets: [],
        opportunities: [],
        marketGroups: [],
        protocolMetrics: null,
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 1.1,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
          signals: [],
          notes: []
        },
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [8453],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null
      }
    ],
    tokenizedBtc: [
      {
        id: "cbbtc",
        kind: "tokenized-btc" as const,
        symbol: "cbBTC",
        name: "Coinbase Wrapped BTC",
        type: "tokenized-btc",
        protocolId: "coinbase",
        website: "https://www.coinbase.com/cbbtc",
        coingeckoId: "coinbase-wrapped-btc",
        chains: [1, 8453, 42161],
        tags: ["tokenized-btc"],
        protocol: { id: "coinbase", name: "Coinbase" },
        issuerProtocol: { id: "coinbase", name: "Coinbase", website: "https://www.coinbase.com/cbbtc" },
        marketGroups: [],
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1, 8453, 42161],
        linkedOpportunityRoutes: [
          {
            opportunity: {
              id: "aave-cbbtc-base",
              title: "Aave cbBTC on Base",
              protocolId: "aave",
              assetId: "cbbtc",
              chainId: 8453,
              category: "lending",
              tags: ["tokenized-btc"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-a",
              status: "active" as const,
              protocol: { id: "aave", name: "Aave" },
              asset: { id: "cbbtc", symbol: "cbBTC", name: "Coinbase Wrapped BTC", type: "tokenized-btc", tags: ["tokenized-btc"] },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "pool-a",
                grossApy: 2.5,
                apyBase: 2.5,
                apyReward: null,
                tvlUsd: null,
                rewardTokens: [],
                underlyingTokens: [],
                fetchedAt: "2026-01-01T00:00:00Z",
                warnings: [],
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=cbbtc-base"
              },
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 4,
                expectedLossThroughExpiry: 1,
                riskAdjustedYieldThroughExpiry: 3,
                derived90dEquivalent: 1.35,
                confidence: "medium" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 2.5,
            expectedLossToHorizon: 1,
            netYieldToHorizon: 3,
            netYield90d: 1.35,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          },
          {
            opportunity: {
              id: "aave-cbbtc-eth",
              title: "Aave cbBTC on Ethereum",
              protocolId: "aave",
              assetId: "cbbtc",
              chainId: 1,
              category: "lending",
              tags: ["tokenized-btc"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-b",
              status: "active" as const,
              protocol: { id: "aave", name: "Aave" },
              asset: { id: "cbbtc", symbol: "cbBTC", name: "Coinbase Wrapped BTC", type: "tokenized-btc", tags: ["tokenized-btc"] },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "pool-b",
                grossApy: 1.2,
                apyBase: 1.2,
                apyReward: null,
                tvlUsd: null,
                rewardTokens: [],
                underlyingTokens: [],
                fetchedAt: "2026-01-01T00:00:00Z",
                warnings: [],
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=cbbtc-eth"
              },
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 2,
                expectedLossThroughExpiry: 1,
                riskAdjustedYieldThroughExpiry: 1,
                derived90dEquivalent: 0.45,
                confidence: "medium" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 1.2,
            expectedLossToHorizon: 1,
            netYieldToHorizon: 1,
            netYield90d: 0.45,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          },
          {
            opportunity: {
              id: "compound-cbbtc-base",
              title: "Compound cbBTC on Base",
              protocolId: "compound",
              assetId: "cbbtc",
              chainId: 8453,
              category: "lending",
              tags: ["tokenized-btc"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-c",
              status: "active" as const,
              protocol: { id: "compound", name: "Compound" },
              asset: { id: "cbbtc", symbol: "cbBTC", name: "Coinbase Wrapped BTC", type: "tokenized-btc", tags: ["tokenized-btc"] },
              marketGroups: [],
              metrics: null,
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 3,
                expectedLossThroughExpiry: 1,
                riskAdjustedYieldThroughExpiry: 2,
                derived90dEquivalent: 0.9,
                confidence: "medium" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 1.8,
            expectedLossToHorizon: 1,
            netYieldToHorizon: 2,
            netYield90d: 0.9,
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
          expectedLossThroughExpiry: 3,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
          signals: [
            {
              kind: "depeg" as const,
              label: "cbBTC trades below 0.98 BTC",
              marketName: "cbBTC depeg",
              marketType: "categorical" as const,
              horizonEnd: "2026-12-31T23:59:59Z",
              probability: 0.07,
              probabilitySource: "seer" as const,
              resolvedValue: null,
              expectedLoss: 3,
              liquidityUsd: 1000,
              status: "OPEN",
              odds: [0.93, 0.07],
              severity: 1,
              marketSyncStatus: "created" as const,
              url: "https://seer.pm/markets/cbbtc-depeg"
            }
          ],
          notes: []
        }
      }
    ]
  })
}));

describe("TokenizedBtcDetailPage", () => {
  it("collapses routes by protocol and filters them by chain", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter initialEntries={["/tokenized-btc/cbbtc"]}>
        <Routes>
          <Route path="/tokenized-btc/:id" element={<TokenizedBtcDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Routes for cbBTC")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Platform" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Coinbase" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://www.coinbase.com/cbbtc");
    expect(screen.getByRole("link", { name: "DefiLlama" })).toHaveAttribute("href", "https://defillama.com/yields?symbol=cbBTC");
    expect(screen.getByRole("link", { name: "CoinGecko" })).toHaveAttribute(
      "href",
      "https://www.coingecko.com/en/coins/coinbase-wrapped-btc"
    );
    expect(screen.queryByText(/Risk summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Issuer context/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Issuer$/)).not.toBeInTheDocument();
    expect(screen.getByText("Observed chains")).toBeInTheDocument();
    expect(screen.getByText("Ethereum, Base, Arbitrum")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trade on Seer" })).toHaveAttribute("href", "https://seer.pm/markets/cbbtc-depeg");
    const highestApyCard = screen.getAllByText("Highest APY route")[0]?.closest(".summary-card");
    expect(highestApyCard).not.toBeNull();
    expect(within(highestApyCard as HTMLElement).getByRole("link", { name: "Aave cbBTC on Base" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=cbbtc-base"
    );
    const routeTable = screen.getByRole("table");
    expect(within(routeTable).getAllByRole("link", { name: "Aave" })).toHaveLength(1);
    expect(container.querySelector('img[src="/logos/test/aave.png"]')).not.toBeNull();
    expect(container.querySelector('img[src="/logos/test/compound.png"]')).not.toBeNull();
    expect(within(routeTable).getByText("0.60%")).toBeInTheDocument();
    expect(within(routeTable).getByText("1.20% - 2.50%")).toBeInTheDocument();
    expect(within(routeTable).getByText("Ethereum, Base")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All chains/i }));
    await user.click(screen.getByLabelText("Ethereum"));

    expect(within(routeTable).getAllByText("1.20%").length).toBeGreaterThan(0);
    expect(within(routeTable).getByText("Ethereum")).toBeInTheDocument();
    expect(within(routeTable).getByRole("link", { name: "Aave cbBTC on Ethereum" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=cbbtc-eth"
    );
  });
});
