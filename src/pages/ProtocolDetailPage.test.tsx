import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtocolDetailPage } from "./ProtocolDetailPage";

vi.mock("../hooks/useTerminalData", () => ({
  useTerminalData: () => ({
    protocols: [
      {
        id: "ethereum",
        kind: "protocol" as const,
        name: "Ethereum",
        website: "https://ethereum.org",
        category: "layer-1",
        chains: [1],
        overviewChains: [1],
        tags: ["layer-1"],
        description: "Base network",
        status: "active" as const,
        defillamaProjectId: undefined,
        protocolMetrics: null,
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
        },
        linkedMarkets: [],
        yieldRelationships: [],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null,
        assets: [],
        opportunities: [],
        marketGroups: []
      },
      {
        id: "aave",
        kind: "protocol" as const,
        name: "Aave",
        website: "https://aave.com",
        category: "lending",
        chains: [1, 8453],
        overviewChains: [1, 8453],
        tags: ["platform-surface", "lending"],
        description: "Money market",
        status: "active" as const,
        defillamaProjectId: "aave-v3",
        protocolMetrics: {
          source: "defillama" as const,
          sourceId: "aave",
          minApy: 2.4,
          maxApy: 6.7,
          totalTvlUsd: 12000000,
          poolsCount: 3,
          fetchedAt: "2026-04-24T00:00:00.000Z",
          url: "https://defillama.com/protocol/aave",
          warnings: []
        },
        riskProfile: {
          horizonEnd: "2026-12-31T00:00:00.000Z",
          horizonDays: 251,
          grossYieldThroughExpiry: 8,
          expectedLossThroughExpiry: 1.8,
          riskAdjustedYieldThroughExpiry: 6.2,
          derived90dEquivalent: 4.1,
          confidence: "high" as const,
          coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 10000 },
          signals: [],
          notes: []
        },
        linkedMarkets: [],
        yieldRelationships: [],
        bestEligibleOpportunity: null,
        assets: [],
        opportunities: [],
        marketGroups: [],
        linkedOpportunityRoutes: [
          {
            opportunity: {
              id: "usdc-base",
              title: "Aave USDC on Base",
              protocolId: "aave",
              assetId: "usdc",
              chainId: 8453,
              category: "lending",
              tags: [],
              yieldSource: "defillama" as const,
              yieldSourceId: "aave-usdc-base",
              status: "active" as const,
              protocol: {
                id: "aave",
                name: "Aave",
                website: "https://aave.com",
                category: "lending",
                chains: [1, 8453],
                tags: ["platform-surface", "lending"],
                description: "Money market",
                status: "active" as const
              },
              asset: {
                id: "usdc",
                symbol: "USDC",
                name: "USD Coin",
                type: "stablecoin",
                protocolId: "circle",
                website: "https://circle.com/usdc",
                logoUrl: "/logos/assets/usdc.png",
                chains: [1, 8453],
                tags: ["stablecoin"]
              },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "aave-usdc-base",
                grossApy: 6.7,
                apyBase: 6.2,
                apyReward: 0.5,
                tvlUsd: 5000000,
                rewardTokens: [],
                underlyingTokens: ["USDC"],
                fetchedAt: "2026-04-24T00:00:00.000Z",
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=usdc-base",
                warnings: []
              },
              riskProfile: {
                horizonEnd: "2026-12-31T00:00:00.000Z",
                horizonDays: 251,
                grossYieldThroughExpiry: 8,
                expectedLossThroughExpiry: 1.1,
                riskAdjustedYieldThroughExpiry: 6.9,
                derived90dEquivalent: 6.2,
                confidence: "high" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 4000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 6.7,
            adjustedApy: 6.2,
            displayApy: 6.2,
            expectedLossToHorizon: 1.1,
            netYieldToHorizon: 6.9,
            netYield90d: 6.2,
            confidence: "high" as const,
            horizonEnd: "2026-12-31T00:00:00.000Z",
            horizonDays: 251,
            isEligible: true
          },
          {
            opportunity: {
              id: "usdc-eth",
              title: "Aave USDC on Ethereum",
              protocolId: "aave",
              assetId: "usdc",
              chainId: 1,
              category: "lending",
              tags: [],
              yieldSource: "defillama" as const,
              yieldSourceId: "aave-usdc-eth",
              status: "active" as const,
              protocol: {
                id: "aave",
                name: "Aave",
                website: "https://aave.com",
                category: "lending",
                chains: [1, 8453],
                tags: ["platform-surface", "lending"],
                description: "Money market",
                status: "active" as const
              },
              asset: {
                id: "usdc",
                symbol: "USDC",
                name: "USD Coin",
                type: "stablecoin",
                protocolId: "circle",
                website: "https://circle.com/usdc",
                logoUrl: "/logos/assets/usdc.png",
                chains: [1, 8453],
                tags: ["stablecoin"]
              },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "aave-usdc-eth",
                grossApy: 4.1,
                apyBase: 4.1,
                apyReward: 0,
                tvlUsd: 4000000,
                rewardTokens: [],
                underlyingTokens: ["USDC"],
                fetchedAt: "2026-04-24T00:00:00.000Z",
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=usdc-eth",
                warnings: []
              },
              riskProfile: {
                horizonEnd: "2026-12-31T00:00:00.000Z",
                horizonDays: 251,
                grossYieldThroughExpiry: 5,
                expectedLossThroughExpiry: 0.9,
                riskAdjustedYieldThroughExpiry: 4.1,
                derived90dEquivalent: 4.1,
                confidence: "high" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 4000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 4.1,
            adjustedApy: 4.1,
            displayApy: 4.1,
            expectedLossToHorizon: 0.9,
            netYieldToHorizon: 4.1,
            netYield90d: 4.1,
            confidence: "high" as const,
            horizonEnd: "2026-12-31T00:00:00.000Z",
            horizonDays: 251,
            isEligible: true
          },
          {
            opportunity: {
              id: "weth-eth",
              title: "Aave WETH on Ethereum",
              protocolId: "aave",
              assetId: "weth",
              chainId: 1,
              category: "lending",
              tags: [],
              yieldSource: "defillama" as const,
              yieldSourceId: "aave-weth-eth",
              status: "active" as const,
              protocol: {
                id: "aave",
                name: "Aave",
                website: "https://aave.com",
                category: "lending",
                chains: [1, 8453],
                tags: ["platform-surface", "lending"],
                description: "Money market",
                status: "active" as const
              },
              asset: {
                id: "weth",
                symbol: "WETH",
                name: "Wrapped Ether",
                type: "core-asset",
                protocolId: "ethereum",
                website: "https://weth.io",
                logoUrl: "/logos/assets/eth.png",
                chains: [1],
                tags: ["core-asset"]
              },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "aave-weth-eth",
                grossApy: 2.4,
                apyBase: 2.4,
                apyReward: 0,
                tvlUsd: 3000000,
                rewardTokens: [],
                underlyingTokens: ["WETH"],
                fetchedAt: "2026-04-24T00:00:00.000Z",
                url: "https://app.aave.com/reserve-overview/?underlyingAsset=weth-eth",
                warnings: []
              },
              riskProfile: {
                horizonEnd: "2026-12-31T00:00:00.000Z",
                horizonDays: 251,
                grossYieldThroughExpiry: 3,
                expectedLossThroughExpiry: 0.7,
                riskAdjustedYieldThroughExpiry: 2.4,
                derived90dEquivalent: 2.4,
                confidence: "high" as const,
                coverage: { configured: 1, priced: 1, unpriced: 0, resolved: 0, totalLiquidityUsd: 4000 },
                signals: [],
                notes: []
              }
            },
            grossApy: 2.4,
            adjustedApy: 2.4,
            displayApy: 2.4,
            expectedLossToHorizon: 0.7,
            netYieldToHorizon: 2.4,
            netYield90d: 2.4,
            confidence: "high" as const,
            horizonEnd: "2026-12-31T00:00:00.000Z",
            horizonDays: 251,
            isEligible: true
          }
        ]
      }
    ]
  })
}));

describe("ProtocolDetailPage", () => {
  it("rejects non-platform protocols even if they exist in terminal data", async () => {
    render(
      <MemoryRouter initialEntries={["/protocols/ethereum"]}>
        <Routes>
          <Route path="/protocols/:id" element={<ProtocolDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Platform not found/i)).toBeInTheDocument();
  });

  it("supports asset sorting and chain filtering on the platform detail table", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter initialEntries={["/protocols/aave"]}>
        <Routes>
          <Route path="/protocols/:id" element={<ProtocolDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Routes by asset")).toBeInTheDocument();
    expect(screen.queryByText(/Review venue-level risk/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://aave.com");
    expect(screen.getByRole("link", { name: "DefiLlama" })).toHaveAttribute("href", "https://defillama.com/protocol/aave");
    expect(screen.getByLabelText("Sort by")).toHaveValue("apy");
    expect(screen.getByRole("button", { name: /All chains/i })).toBeInTheDocument();
    expect(screen.getByText("Across 2 tracked assets")).toBeInTheDocument();
    expect(screen.getByText("Observed chains")).toBeInTheDocument();
    expect(screen.getByText("Total TVL")).toBeInTheDocument();
    expect(screen.queryByText("Total tracked TVL")).not.toBeInTheDocument();
    expect(screen.getByText("Observed chains").closest(".summary-card")).toHaveTextContent("Ethereum, Base");
    expect(container.querySelector(".overview-pill-row")).toBeNull();

    const routeTable = screen.getByRole("table");
    expect(within(routeTable).queryByText("Horizon")).not.toBeInTheDocument();
    expect(within(routeTable).queryByText("Dec 31, 2026")).not.toBeInTheDocument();
    expect(within(routeTable).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Asset",
      "APY",
      "Highest APY route"
    ]);
    expect(within(routeTable).getByRole("link", { name: "Aave USDC on Base" })).toBeInTheDocument();
    expect(within(screen.getAllByRole("row")[1]!).getByText("USDC")).toBeInTheDocument();
    expect(container.querySelector('img[src="/logos/assets/usdc.png"]')).not.toBeNull();
    expect(container.querySelector('img[src="/logos/assets/eth.png"]')).not.toBeNull();
    expect(within(routeTable).getByText("4.10% - 6.20%")).toBeInTheDocument();
    expect(within(routeTable).getByText("2.40%")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Sort by"), "symbol");

    expect(within(screen.getAllByRole("row")[1]!).getByText("USDC")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All chains/i }));
    await user.click(within(screen.getByRole("dialog", { name: "Chains options" })).getByLabelText("Ethereum"));

    expect(screen.getByText("Across 2 tracked assets")).toBeInTheDocument();
    expect(within(routeTable).getByRole("link", { name: "Aave USDC on Ethereum" })).toBeInTheDocument();
    expect(within(routeTable).getByText("4.10%")).toBeInTheDocument();
    expect(screen.getByText("2.40% - 4.10%")).toBeInTheDocument();
    expect(screen.queryByText("Aave USDC on Base")).not.toBeInTheDocument();
  });
});
