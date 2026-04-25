import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtocolsPage } from "./ProtocolsPage";

vi.mock("../hooks/useTerminalData", () => ({
  useTerminalData: () => ({
    isLoading: false,
    error: null,
    protocols: [
      {
        id: "aave",
        kind: "protocol" as const,
        name: "Aave",
        website: "https://aave.com",
        category: "lending",
        chains: [1],
        tags: ["lending", "platform-surface"],
        description: "Money market",
        status: "active" as const,
        defillamaProjectId: "aave-v3",
        assets: [],
        opportunities: [{ id: "aave-gho-eth" }],
        marketGroups: [],
        protocolMetrics: {
          source: "defillama" as const,
          sourceId: "aave-v3",
          minApy: 2,
          maxApy: 6,
          totalTvlUsd: 8000000,
          poolsCount: 2,
          fetchedAt: new Date().toISOString(),
          warnings: []
        },
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 3.2,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: {
            configured: 1,
            priced: 1,
            unpriced: 0,
            resolved: 0,
            totalLiquidityUsd: 1500
          },
          signals: [],
          notes: []
        },
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1],
        linkedOpportunityRoutes: [
          {
            opportunity: {
              id: "aave-gho-eth",
              title: "Aave GHO Savings on Ethereum",
              protocolId: "aave",
              assetId: "gho",
              chainId: 1,
              category: "stablecoin",
              tags: ["stablecoin"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-a",
              status: "active" as const,
              protocol: { id: "aave", name: "Aave" },
              asset: { id: "gho", symbol: "GHO", name: "Aave GHO", type: "stablecoin", tags: ["stablecoin"] },
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
            grossApy: 4.5,
            expectedLossToHorizon: 1,
            netYieldToHorizon: 2,
            netYield90d: 0.9,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          }
        ],
        bestEligibleOpportunity: {
          opportunity: {
            id: "aave-gho-eth",
            title: "Aave GHO Savings on Ethereum",
            protocolId: "aave",
            assetId: "gho",
            chainId: 1,
            category: "stablecoin",
            tags: ["stablecoin"],
            yieldSource: "defillama" as const,
            yieldSourceId: "pool-a",
            status: "active" as const,
            protocol: { id: "aave", name: "Aave" },
            asset: { id: "gho", symbol: "GHO", name: "Aave GHO", type: "stablecoin", tags: ["stablecoin"] },
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
          grossApy: 4.5,
          expectedLossToHorizon: 1,
          netYieldToHorizon: 2,
          netYield90d: 0.9,
          confidence: "medium" as const,
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          isEligible: true
        }
      },
      {
        id: "lido",
        kind: "protocol" as const,
        name: "Lido",
        website: "https://lido.fi",
        category: "staking",
        chains: [1],
        tags: ["staking", "platform-surface"],
        description: "Liquid staking venue",
        status: "active" as const,
        defillamaProjectId: "lido",
        assets: [],
        opportunities: [],
        marketGroups: [],
        protocolMetrics: {
          source: "defillama" as const,
          sourceId: "lido",
          minApy: 2.8,
          maxApy: 2.8,
          totalTvlUsd: 12000000,
          poolsCount: 1,
          fetchedAt: new Date().toISOString(),
          warnings: []
        },
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 7.5,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "high" as const,
          coverage: {
            configured: 1,
            priced: 1,
            unpriced: 0,
            resolved: 0,
            totalLiquidityUsd: 2500
          },
          signals: [],
          notes: []
        },
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null
      }
    ]
  })
}));

describe("ProtocolsPage", () => {
  it("supports platform sorting controls while hiding the top-route column", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProtocolsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Platform Safety")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Seer" })).toHaveAttribute("href", "https://seer.pm");
    expect(screen.getByText("Highest APY platform")).toBeInTheDocument();
    expect(screen.getByText("Highest TVL platform")).toBeInTheDocument();
    const highestApyCard = screen.getByText("Highest APY platform").closest(".summary-card");
    const highestTvlCard = screen.getByText("Highest TVL platform").closest(".summary-card");
    expect(highestApyCard).not.toBeNull();
    expect(highestTvlCard).not.toBeNull();
    expect(within(highestApyCard as HTMLElement).getByText("4.50%")).toHaveClass("value-positive");
    expect(within(highestApyCard as HTMLElement).getByRole("link", { name: "Aave" })).toHaveAttribute("href", "https://aave.com");
    expect(within(highestTvlCard as HTMLElement).getByRole("link", { name: "Lido" })).toHaveAttribute("href", "https://lido.fi");
    expect(screen.getAllByText("$12.00M").length).toBeGreaterThan(0);
    expect(screen.queryByText("Total tracked TVL")).not.toBeInTheDocument();
    const platformLinks = screen.getAllByRole("link", { name: /Aave|Lido/ });
    expect(platformLinks[0]).toHaveTextContent("Aave");
    expect(within(screen.getAllByRole("row")[2]!).getByRole("link", { name: "Lido" })).toBeInTheDocument();
    expect(screen.getByText("Supported chains")).toBeInTheDocument();
    expect(screen.getAllByText("1 chain")).toHaveLength(2);
    expect(screen.getAllByText("Ethereum")).toHaveLength(2);
    expect(within(screen.getAllByRole("row")[1]!).getByText("4.50%")).toBeInTheDocument();
    expect(screen.queryByText("Highest APY route")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Sort by")).toHaveValue("safety");
    expect(screen.getByRole("button", { name: /All chains/i })).toBeInTheDocument();
    expect(within(screen.getAllByRole("row")[1]!).getByText("Aave")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Sort by"), "apy");

    expect(within(screen.getAllByRole("row")[1]!).getByText("Aave")).toBeInTheDocument();
  });
});
