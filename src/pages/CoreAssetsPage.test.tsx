import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CoreAssetsPage } from "./CoreAssetsPage";

const aaveProtocol = {
  id: "aave",
  name: "Aave",
  website: "https://aave.com",
  category: "lending",
  chains: [1, 8453],
  tags: ["lending", "platform-surface"],
  description: "Money market",
  status: "active" as const
};

const lidoProtocol = {
  id: "lido",
  name: "Lido",
  website: "https://lido.fi",
  category: "staking",
  chains: [1],
  tags: ["staking", "platform-surface"],
  description: "Liquid staking",
  status: "active" as const
};

const ethAsset = {
  id: "eth",
  symbol: "ETH",
  name: "Ether",
  type: "core-asset",
  protocolId: "ethereum",
  chains: [1, 8453],
  tags: ["core-asset"],
  protocol: { id: "ethereum", name: "Ethereum", website: "https://ethereum.org" },
  marketGroups: [],
  linkedMarkets: [],
  yieldRelationships: [],
  overviewChains: [1, 8453],
  bestEligibleOpportunity: null,
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
    notes: []
  }
};

const arbAsset = {
  id: "arb",
  symbol: "ARB",
  name: "Arbitrum",
  type: "core-asset",
  protocolId: "arbitrum-foundation",
  chains: [42161],
  tags: ["core-asset"],
  protocol: { id: "arbitrum-foundation", name: "Arbitrum", website: "https://arbitrum.io" },
  marketGroups: [],
  linkedMarkets: [],
  yieldRelationships: [],
  overviewChains: [42161],
  bestEligibleOpportunity: null,
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
    notes: []
  },
  linkedOpportunityRoutes: []
};

vi.mock("../hooks/useTerminalData", () => ({
  useTerminalData: () => ({
    isLoading: false,
    error: null,
    coreAssets: [
      {
        ...ethAsset,
        yieldRelationships: [
          {
            id: "supports_yield_for:aave:eth:aave-eth-eth",
            relationType: "supports_yield_for" as const,
            protocol: aaveProtocol,
            asset: ethAsset,
            opportunity: null,
            chainIds: [1],
            label: "Aave ETH market",
            priority: 1
          },
          {
            id: "supports_yield_for:lido:eth:lido-eth-staking",
            relationType: "supports_yield_for" as const,
            protocol: lidoProtocol,
            asset: ethAsset,
            opportunity: null,
            chainIds: [1],
            label: "Lido staking",
            priority: 2
          }
        ],
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
              protocol: aaveProtocol,
              asset: ethAsset,
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
                coverage: {
                  configured: 1,
                  priced: 1,
                  unpriced: 0,
                  resolved: 0,
                  totalLiquidityUsd: 1000
                },
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
              id: "lido-eth-staking",
              title: "Lido ETH staking",
              protocolId: "lido",
              assetId: "eth",
              chainId: 1,
              category: "staking",
              tags: ["core-asset"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-b",
              status: "active" as const,
              protocol: lidoProtocol,
              asset: ethAsset,
              marketGroups: [],
              metrics: null,
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 3,
                expectedLossThroughExpiry: 0.6,
                riskAdjustedYieldThroughExpiry: 2.4,
                derived90dEquivalent: 1.08,
                confidence: "medium" as const,
                coverage: {
                  configured: 1,
                  priced: 1,
                  unpriced: 0,
                  resolved: 0,
                  totalLiquidityUsd: 1000
                },
                signals: [],
                notes: []
              }
            },
            grossApy: 3.9,
            expectedLossToHorizon: 0.6,
            netYieldToHorizon: 2.4,
            netYield90d: 1.08,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          }
        ]
      },
      {
        ...arbAsset
      }
    ]
  })
}));

describe("CoreAssetsPage", () => {
  it("supports APY sorting, chain filtering, and protocol links", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter>
        <CoreAssetsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Core Asset APY")).toBeInTheDocument();
    expect(screen.getByText("Highest APY asset")).toBeInTheDocument();
    expect(screen.getByText("Widest chain coverage")).toBeInTheDocument();
    const highestApyCard = screen.getByText("Highest APY asset").closest(".summary-card");
    expect(highestApyCard).not.toBeNull();
    expect(within(highestApyCard as HTMLElement).getByText("6.20%")).toHaveClass("value-positive");
    expect(screen.queryByText("Tracked routes")).not.toBeInTheDocument();
    expect(screen.queryByText("No route yet")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ETH" })).toHaveAttribute("href", "/core-assets/eth");
    expect(screen.getAllByText("No route").length).toBeGreaterThan(0);
    expect(screen.getByText("3.90% - 6.20%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Aave" })).toHaveAttribute("href", "/protocols/aave");
    expect(screen.getByRole("link", { name: "Lido" })).toHaveAttribute("href", "/protocols/lido");
    expect(screen.getByRole("link", { name: "Aave ETH on Base" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=eth-base"
    );
    expect(container.querySelectorAll(".entity-logo-image")).toHaveLength(2);

    expect(within(screen.getAllByRole("row")[1]!).getByText("ETH")).toBeInTheDocument();
    expect(within(screen.getAllByRole("row")[2]!).getByText("ARB")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All chains/i }));
    await user.click(screen.getByLabelText("Ethereum"));

    expect(within(screen.getAllByRole("row")[1]!).getByText("ETH")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.queryByText("ARB")).not.toBeInTheDocument();
  });
});
