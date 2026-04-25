import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { StablecoinsPage } from "./StablecoinsPage";

vi.mock("../hooks/useTerminalData", () => ({
  useTerminalData: () => ({
    isLoading: false,
    error: null,
    stablecoins: [
      {
        id: "usdc",
        kind: "stablecoin" as const,
        symbol: "USDC",
        name: "USD Coin",
        type: "stablecoin",
        protocolId: "circle",
        chains: [1],
        tags: ["stablecoin"],
        protocol: { id: "circle", name: "Circle" },
        issuerProtocol: { id: "circle", name: "Circle", website: "https://circle.com" },
        marketGroups: [],
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1],
        linkedOpportunityRoutes: [],
        bestEligibleOpportunity: null,
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 1.5,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: {
            configured: 1,
            priced: 1,
            unpriced: 0,
            resolved: 0,
            totalLiquidityUsd: 1000
          },
          signals: [
            {
              kind: "depeg" as const,
              label: "USDC trades below $0.98",
              probability: 0.02
            }
          ],
          notes: []
        }
      },
      {
        id: "usde",
        kind: "stablecoin" as const,
        symbol: "USDe",
        name: "Ethena USDe",
        type: "stablecoin",
        protocolId: "ethena",
        chains: [1, 8453],
        tags: ["stablecoin"],
        protocol: { id: "ethena", name: "Ethena" },
        issuerProtocol: { id: "ethena", name: "Ethena", website: "https://ethena.fi" },
        marketGroups: [],
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1, 8453],
        linkedOpportunityRoutes: [
          {
            opportunity: {
              id: "ethena-usde-route",
              title: "Ethena USDe Savings",
              protocolId: "ethena",
              assetId: "usde",
              chainId: 1,
              category: "stablecoin",
              tags: ["stablecoin"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-a",
              status: "active" as const,
              protocol: { id: "ethena", name: "Ethena" },
              asset: { id: "usde", symbol: "USDe", name: "Ethena USDe", type: "stablecoin", tags: ["stablecoin"] },
              marketGroups: [],
              metrics: null,
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 4,
                expectedLossThroughExpiry: 1,
                riskAdjustedYieldThroughExpiry: 3,
                derived90dEquivalent: 1.35,
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
            grossApy: 6,
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
              id: "ethena-usde-base-route",
              title: "Ethena USDe on Base",
              protocolId: "ethena",
              assetId: "usde",
              chainId: 8453,
              category: "stablecoin",
              tags: ["stablecoin"],
              yieldSource: "defillama" as const,
              yieldSourceId: "pool-b",
              status: "active" as const,
              protocol: { id: "morpho", name: "Morpho" },
              asset: { id: "usde", symbol: "USDe", name: "Ethena USDe", type: "stablecoin", tags: ["stablecoin"] },
              marketGroups: [],
              metrics: {
                source: "defillama" as const,
                sourceId: "pool-b",
                grossApy: 8,
                apyBase: 8,
                apyReward: null,
                tvlUsd: null,
                rewardTokens: [],
                underlyingTokens: [],
                fetchedAt: "2026-01-01T00:00:00Z",
                warnings: [],
                url: "https://app.ethena.fi/join"
              },
              riskProfile: {
                horizonEnd: "2026-12-31T23:59:59Z",
                horizonDays: 200,
                grossYieldThroughExpiry: 6,
                expectedLossThroughExpiry: 1.5,
                riskAdjustedYieldThroughExpiry: 4.5,
                derived90dEquivalent: 2.03,
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
            grossApy: 8,
            expectedLossToHorizon: 1.5,
            netYieldToHorizon: 4.5,
            netYield90d: 2.03,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          }
        ],
        bestEligibleOpportunity: {
          opportunity: {
            id: "ethena-usde-base-route",
            title: "Ethena USDe on Base",
            protocolId: "ethena",
            assetId: "usde",
            chainId: 8453,
            category: "stablecoin",
            tags: ["stablecoin"],
            yieldSource: "defillama" as const,
            yieldSourceId: "pool-b",
            status: "active" as const,
            protocol: { id: "morpho", name: "Morpho" },
            asset: { id: "usde", symbol: "USDe", name: "Ethena USDe", type: "stablecoin", tags: ["stablecoin"] },
            marketGroups: [],
            metrics: {
              source: "defillama" as const,
              sourceId: "pool-b",
              grossApy: 8,
              apyBase: 8,
              apyReward: null,
              tvlUsd: null,
              rewardTokens: [],
              underlyingTokens: [],
              fetchedAt: "2026-01-01T00:00:00Z",
              warnings: [],
              url: "https://app.ethena.fi/join"
            },
            riskProfile: {
              horizonEnd: "2026-12-31T23:59:59Z",
              horizonDays: 200,
              grossYieldThroughExpiry: 6,
              expectedLossThroughExpiry: 1.5,
              riskAdjustedYieldThroughExpiry: 4.5,
              derived90dEquivalent: 2.03,
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
          grossApy: 8,
          expectedLossToHorizon: 1.5,
          netYieldToHorizon: 4.5,
          netYield90d: 2.03,
          confidence: "medium" as const,
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          isEligible: true
        },
        riskProfile: {
          horizonEnd: "2026-12-31T23:59:59Z",
          horizonDays: 200,
          grossYieldThroughExpiry: null,
          expectedLossThroughExpiry: 3,
          riskAdjustedYieldThroughExpiry: null,
          derived90dEquivalent: null,
          confidence: "medium" as const,
          coverage: {
            configured: 1,
            priced: 1,
            unpriced: 0,
            resolved: 0,
            totalLiquidityUsd: 1000
          },
          signals: [
            {
              kind: "depeg" as const,
              label: "USDe trades below $0.98",
              probability: 0.08
            }
          ],
          notes: []
        }
      }
    ]
  })
}));

describe("StablecoinsPage", () => {
  it("supports APY sorting and chain filtering from dropdown controls", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter>
        <StablecoinsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Stablecoin Safety")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Seer" })).toHaveAttribute("href", "https://seer.pm");
    expect(screen.getByText("Safest stablecoin")).toBeInTheDocument();
    expect(screen.getByText("Highest APY stablecoin")).toBeInTheDocument();
    const highestApyCard = screen.getByText("Highest APY stablecoin").closest(".summary-card");
    expect(highestApyCard).not.toBeNull();
    expect(within(highestApyCard as HTMLElement).getByText("8.00%")).toHaveClass("value-positive");
    expect(screen.queryByText("No route yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Configured depeg markets")).not.toBeInTheDocument();
    const stablecoinLinks = screen.getAllByRole("link", { name: /USDC|USDe/ });
    expect(stablecoinLinks[0]).toHaveTextContent("USDC");
    expect(screen.getAllByText("No route").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2.0%").length).toBeGreaterThan(0);
    expect(screen.getByText("APY range")).toBeInTheDocument();
    expect(screen.getByText("Supported chains")).toBeInTheDocument();
    expect(screen.getByText("Ethereum, Base")).toBeInTheDocument();
    expect(screen.getByText("6.00% - 8.00%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Circle" })).toHaveAttribute("href", "https://circle.com");
    expect(screen.getByRole("link", { name: "Ethena USDe on Base" })).toHaveAttribute(
      "href",
      "https://app.ethena.fi/join"
    );
    expect(container.querySelectorAll(".entity-logo-image")).toHaveLength(2);

    await user.selectOptions(screen.getByLabelText("Sort by"), "apy");

    expect(screen.getAllByRole("link", { name: /USDC|USDe/ })[0]).toHaveTextContent("USDe");

    await user.click(screen.getByRole("button", { name: /All chains/i }));
    await user.click(screen.getByLabelText("Base"));

    expect(screen.queryByRole("link", { name: "USDC" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "USDe" })).toBeInTheDocument();
    expect(screen.getAllByText("USDe").length).toBeGreaterThan(0);
    expect(screen.getAllByText("8.00%").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Ethena USDe on Base" })).toHaveAttribute(
      "href",
      "https://app.ethena.fi/join"
    );
  });
});
