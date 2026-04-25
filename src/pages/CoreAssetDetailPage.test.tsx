import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CoreAssetDetailPage } from "./CoreAssetDetailPage";

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
          expectedLossThroughExpiry: 1,
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
        id: "lido",
        kind: "protocol" as const,
        name: "Lido",
        website: "https://lido.fi",
        logoUrl: "/logos/test/lido.png",
        category: "Staking",
        chains: [1],
        tags: ["platform"],
        description: "Lido protocol",
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
        overviewChains: [1],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null
      }
    ],
    coreAssets: [
      {
        id: "eth",
        kind: "core-asset" as const,
        symbol: "ETH",
        name: "Ether",
        type: "core-asset",
        protocolId: "ethereum",
        website: "https://ethereum.org/en/eth/",
        coingeckoId: "ethereum",
        chains: [1, 8453],
        tags: ["core-asset"],
        protocol: {
          id: "ethereum",
          name: "Ethereum",
          website: "https://ethereum.org",
          logoUrl: "/logos/assets/eth.png",
          category: "base-asset",
          chains: [1, 8453],
          tags: ["core-asset"],
          description: "Native Ethereum asset",
          status: "active" as const
        },
        marketGroups: [],
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1, 8453],
        linkedOpportunityRoutes: [
          {
            opportunity: {
              id: "aave-eth-base",
              title: "Aave ETH on Base",
              protocolId: "aave",
              assetId: "eth",
              chainId: 8453,
              category: "lending",
              tags: ["core-asset"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-a",
              status: "active" as const,
              protocol: { id: "aave", name: "Aave", website: "https://aave.com", logoUrl: "/logos/test/aave.png" },
              asset: { id: "eth", symbol: "ETH", name: "Ether", type: "core-asset", tags: ["core-asset"] },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "pool-a",
                grossApy: 6.2,
                apyBase: 6.2,
                apyReward: null,
                tvlUsd: null,
                rewardTokens: [],
                underlyingTokens: [],
                fetchedAt: "2026-01-01T00:00:00Z",
                warnings: [],
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=eth-base"
              },
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 5,
                expectedLossThroughExpiry: 1,
                riskAdjustedYieldThroughExpiry: 4,
                derived90dEquivalent: 1.8,
                confidence: "medium" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 6.2,
            expectedLossToHorizon: 1,
            netYieldToHorizon: 4,
            netYield90d: 1.8,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          },
          {
            opportunity: {
              id: "aave-eth-eth",
              title: "Aave ETH on Ethereum",
              protocolId: "aave",
              assetId: "eth",
              chainId: 1,
              category: "lending",
              tags: ["core-asset"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-b",
              status: "active" as const,
              protocol: { id: "aave", name: "Aave", website: "https://aave.com", logoUrl: "/logos/test/aave.png" },
              asset: { id: "eth", symbol: "ETH", name: "Ether", type: "core-asset", tags: ["core-asset"] },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "pool-b",
                grossApy: 4.1,
                apyBase: 4.1,
                apyReward: null,
                tvlUsd: null,
                rewardTokens: [],
                underlyingTokens: [],
                fetchedAt: "2026-01-01T00:00:00Z",
                warnings: [],
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=eth-eth"
              },
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
            grossApy: 4.1,
            expectedLossToHorizon: 1,
            netYieldToHorizon: 2,
            netYield90d: 0.9,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          },
          {
            opportunity: {
              id: "lido-eth-staking",
              title: "Lido ETH staking",
              protocolId: "lido",
              assetId: "eth",
              chainId: 1,
              category: "staking",
              tags: ["core-asset"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-c",
              status: "active" as const,
              protocol: { id: "lido", name: "Lido", website: "https://lido.fi", logoUrl: "/logos/test/lido.png" },
              asset: { id: "eth", symbol: "ETH", name: "Ether", type: "core-asset", tags: ["core-asset"] },
              marketGroups: [],
              metrics: null,
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 3.5,
                expectedLossThroughExpiry: 0.6,
                riskAdjustedYieldThroughExpiry: 2.9,
                derived90dEquivalent: 1.31,
                confidence: "medium" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 1000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 3.9,
            expectedLossToHorizon: 0.6,
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
          horizonEnd: null,
          horizonDays: null,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: null,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "insufficient" as const,
          coverage: { configured: 0, priced: 0, unpriced: 0, resolved: 0, totalLiquidityUsd: 0 },
          signals: [],
          notes: []
        }
      }
    ]
  })
}));

describe("CoreAssetDetailPage", () => {
  it("collapses linked opportunities by protocol and filters them by chain", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter initialEntries={["/core-assets/eth"]}>
        <Routes>
          <Route path="/core-assets/:id" element={<CoreAssetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Routes for ETH")).toBeInTheDocument();
    expect(screen.queryByText("Risk summary")).not.toBeInTheDocument();
    expect(screen.queryByText("Asset context")).not.toBeInTheDocument();
    expect(screen.queryByText("Decision frame")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Platform" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Review where ETH is currently covered/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://ethereum.org/en/eth/");
    expect(screen.getByRole("link", { name: "DefiLlama" })).toHaveAttribute("href", "https://defillama.com/yields?symbol=ETH");
    expect(screen.getByRole("link", { name: "CoinGecko" })).toHaveAttribute("href", "https://www.coingecko.com/en/coins/ethereum");
    expect(screen.queryByText("Associated protocol")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Sort by")).toHaveValue("safety");
    expect(screen.getByRole("button", { name: /All chains/i })).toBeInTheDocument();
    const highestApyCard = screen.getAllByText("Highest APY route")[0]?.closest(".summary-card");
    expect(highestApyCard).not.toBeNull();
    expect(within(highestApyCard as HTMLElement).getByRole("link", { name: "Aave ETH on Base" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=eth-base"
    );
    const routeTable = screen.getByRole("table");
    expect(within(routeTable).queryByText("Horizon")).not.toBeInTheDocument();
    expect(within(routeTable).getAllByRole("link", { name: "Aave" })).toHaveLength(1);
    expect(container.querySelector('img[src="/logos/test/aave.png"]')).not.toBeNull();
    expect(within(routeTable).getByText("Exploit Risk")).toBeInTheDocument();
    expect(within(routeTable).getByText("0.60%")).toBeInTheDocument();
    expect(within(routeTable).getByText("1.00%")).toBeInTheDocument();
    expect(within(routeTable).getByText("4.10% - 6.20%")).toBeInTheDocument();
    expect(within(routeTable).getByText("Ethereum, Base")).toBeInTheDocument();
    expect(within(routeTable).queryByRole("link", { name: "Open route" })).not.toBeInTheDocument();
    expect(within(routeTable).getByRole("link", { name: "Aave ETH on Base" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=eth-base"
    );

    await user.selectOptions(screen.getByLabelText("Sort by"), "apy");
    expect(within(screen.getAllByRole("row")[1]!).getByText("Aave")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All chains/i }));
    await user.click(within(screen.getByRole("dialog", { name: "Chains options" })).getByLabelText("Ethereum"));

    expect(within(routeTable).getAllByText("4.10%").length).toBeGreaterThan(0);
    expect(within(routeTable).getAllByText("Ethereum").length).toBeGreaterThan(0);
    expect(within(routeTable).queryByRole("link", { name: "Open route" })).not.toBeInTheDocument();
    expect(within(routeTable).getByRole("link", { name: "Aave ETH on Ethereum" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=eth-eth"
    );
  });
});
