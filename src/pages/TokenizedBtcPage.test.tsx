import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TokenizedBtcPage } from "./TokenizedBtcPage";

vi.mock("../hooks/useTerminalData", () => ({
  useTerminalData: () => ({
    isLoading: false,
    error: null,
    tokenizedBtc: [
      {
        id: "wbtc",
        kind: "tokenized-btc" as const,
        symbol: "WBTC",
        name: "Wrapped Bitcoin",
        type: "tokenized-btc",
        protocolId: "bitgo",
        chains: [1, 8453],
        tags: ["tokenized-btc"],
        protocol: { id: "bitgo", name: "BitGo" },
        issuerProtocol: { id: "bitgo", name: "BitGo", website: "https://www.wbtc.network" },
        marketGroups: [],
        linkedMarkets: [],
        yieldRelationships: [],
        overviewChains: [1, 8453],
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
              label: "WBTC trades below 0.98 BTC",
              probability: 0.03
            }
          ],
          notes: []
        }
      },
      {
        id: "cbbtc",
        kind: "tokenized-btc" as const,
        symbol: "cbBTC",
        name: "Coinbase Wrapped BTC",
        type: "tokenized-btc",
        protocolId: "coinbase",
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
            grossApy: 1.2,
            expectedLossToHorizon: 1,
            netYieldToHorizon: 1,
            netYield90d: 0.45,
            confidence: "medium" as const,
            horizonEnd: "2026-12-31T23:59:59Z",
            horizonDays: 200,
            isEligible: true
          }
        ],
        bestEligibleOpportunity: {
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
          grossApy: 2.5,
          expectedLossToHorizon: 1,
          netYieldToHorizon: 3,
          netYield90d: 1.35,
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
              label: "cbBTC trades below 0.98 BTC",
              probability: 0.07
            }
          ],
          notes: []
        }
      }
    ]
  })
}));

describe("TokenizedBtcPage", () => {
  it("supports APY sorting and chain filtering from dropdown controls", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter>
        <TokenizedBtcPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("BTC Wrapper Safety")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Seer" })).toHaveAttribute("href", "https://seer.pm");
    expect(screen.getByText("Safest wrapper")).toBeInTheDocument();
    expect(screen.getByText("Highest APY wrapper")).toBeInTheDocument();
    const highestApyCard = screen.getByText("Highest APY wrapper").closest(".summary-card");
    expect(highestApyCard).not.toBeNull();
    expect(within(highestApyCard as HTMLElement).getByText("2.50%")).toHaveClass("value-positive");
    expect(screen.queryByText("Widest chain reach")).not.toBeInTheDocument();
    expect(screen.queryByText("No route yet")).not.toBeInTheDocument();
    const wrapperLinks = screen.getAllByRole("link", { name: /WBTC|cbBTC/ });
    expect(wrapperLinks[0]).toHaveTextContent("WBTC");
    expect(screen.getAllByText("No route").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3.0%").length).toBeGreaterThan(0);
    expect(screen.getByText("1.20% - 2.50%")).toBeInTheDocument();
    expect(screen.getByText("Supported chains")).toBeInTheDocument();
    expect(screen.getByText("APY range")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coinbase" })).toHaveAttribute("href", "https://www.coinbase.com/cbbtc");
    expect(screen.getByRole("link", { name: "Aave cbBTC on Base" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=cbbtc-base"
    );
    expect(container.querySelectorAll(".entity-logo-image")).toHaveLength(2);

    await user.selectOptions(screen.getByLabelText("Sort by"), "apy");

    expect(screen.getAllByRole("link", { name: /WBTC|cbBTC/ })[0]).toHaveTextContent("cbBTC");

    await user.click(screen.getByRole("button", { name: /All chains/i }));
    await user.click(screen.getByLabelText("Ethereum"));

    expect(screen.queryByRole("link", { name: "WBTC" })).toBeInTheDocument();
    expect(screen.getByText("WBTC")).toBeInTheDocument();
    expect(screen.getAllByText("1.20%").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Aave cbBTC on Ethereum" })).toHaveAttribute(
      "href",
      "https://app.aave.com/reserve-overview/?underlyingAsset=cbbtc-eth"
    );
  });
});
