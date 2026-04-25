import { describe, expect, it, vi } from "vitest";

vi.mock("@seer-pm/sdk/markets-fetch", () => ({
  fetchMarket: vi.fn(),
}));

vi.mock("@seer-pm/sdk/market", () => ({
  getMarketStatus: () => "open",
  getMarketType: () => "categorical"
}));

vi.mock("@seer-pm/sdk/subgraph", () => ({
  initApiHost: vi.fn(),
}));

import { normalizeSeerMarket } from "./seer";

describe("Seer normalization", () => {
  it("maps binary odds into a normalized risk signal", () => {
    const signal = normalizeSeerMarket(
      {
        id: "aave-loss",
        label: "Aave depositor loss",
        kind: "exploit",
        type: "categorical",
        severity: 0.2,
        seerMarketId: "0x1234",
        creation: {
          status: "created",
          chainId: 100
        }
      },
      {
        id: "0x1234",
        marketName: "Will Aave depositors take a loss?",
        outcomes: ["Yes", "No", "Invalid"],
        odds: [12, 88, null],
        payoutReported: false,
        payoutNumerators: [0n, 0n, 0n],
        lowerBound: 0n,
        upperBound: 0n,
        liquidityUSD: 420,
        openingTs: 0,
        finalizeTs: 0,
        questions: [],
        outcomesSupply: 0n,
        incentive: 0,
        hasLiquidity: true,
        categories: [],
        poolBalance: [],
        url: "",
        type: "Generic",
        collateralToken: "0x0000000000000000000000000000000000000000",
        collateralToken1: "0x0000000000000000000000000000000000000000",
        collateralToken2: "0x0000000000000000000000000000000000000000",
        wrappedTokens: [],
        parentMarket: {
          id: "0x0000000000000000000000000000000000000000",
          conditionId: "0x0",
          payoutReported: false,
          payoutNumerators: []
        },
        parentOutcome: 0n,
        parentCollectionId: "0x0",
        conditionId: "0x0",
        questionId: "0x0",
        templateId: 2n,
        encodedQuestions: [],
        chainId: 100
      } as never,
      "2026-12-31T23:59:59Z"
    );

    expect(signal.probabilitySource).toBe("seer");
    expect(signal.probability).toBeCloseTo(0.12, 5);
    expect(signal.expectedLoss).toBeCloseTo(2.4, 5);
    expect(signal.marketSyncStatus).toBe("created");
  });

  it("uses the yes price directly when only yes has liquidity", () => {
    const signal = normalizeSeerMarket(
      {
        id: "usdc-depeg",
        label: "USDC depeg",
        kind: "depeg",
        type: "categorical",
        severity: 1
      },
      {
        id: "0x1234",
        marketName: "Will USDC drop below 0.98$?",
        outcomes: ["Yes", "No", "Invalid"],
        odds: [5, null, null],
        payoutReported: false,
        payoutNumerators: [0n, 0n, 0n],
        lowerBound: 0n,
        upperBound: 0n,
        liquidityUSD: 10,
        openingTs: 0,
        finalizeTs: 0,
        questions: [],
        outcomesSupply: 0n,
        incentive: 0,
        hasLiquidity: true,
        categories: [],
        poolBalance: [],
        url: "",
        type: "Generic",
        collateralToken: "0x0000000000000000000000000000000000000000",
        collateralToken1: "0x0000000000000000000000000000000000000000",
        collateralToken2: "0x0000000000000000000000000000000000000000",
        wrappedTokens: [],
        parentMarket: {
          id: "0x0000000000000000000000000000000000000000",
          conditionId: "0x0",
          payoutReported: false,
          payoutNumerators: []
        },
        parentOutcome: 0n,
        parentCollectionId: "0x0",
        conditionId: "0x0",
        questionId: "0x0",
        templateId: 2n,
        encodedQuestions: [],
        chainId: 100
      } as never,
      "2026-12-31T23:59:59Z"
    );

    expect(signal.probabilitySource).toBe("seer");
    expect(signal.probability).toBeCloseTo(0.05, 5);
    expect(signal.expectedLoss).toBeCloseTo(5, 5);
  });

  it("infers yes probability from no when only no has liquidity", () => {
    const signal = normalizeSeerMarket(
      {
        id: "usdc-depeg",
        label: "USDC depeg",
        kind: "depeg",
        type: "categorical",
        severity: 1
      },
      {
        id: "0x1234",
        marketName: "Will USDC drop below 0.98$?",
        outcomes: ["Yes", "No", "Invalid"],
        odds: [null, 92, null],
        payoutReported: false,
        payoutNumerators: [0n, 0n, 0n],
        lowerBound: 0n,
        upperBound: 0n,
        liquidityUSD: 10,
        openingTs: 0,
        finalizeTs: 0,
        questions: [],
        outcomesSupply: 0n,
        incentive: 0,
        hasLiquidity: true,
        categories: [],
        poolBalance: [],
        url: "",
        type: "Generic",
        collateralToken: "0x0000000000000000000000000000000000000000",
        collateralToken1: "0x0000000000000000000000000000000000000000",
        collateralToken2: "0x0000000000000000000000000000000000000000",
        wrappedTokens: [],
        parentMarket: {
          id: "0x0000000000000000000000000000000000000000",
          conditionId: "0x0",
          payoutReported: false,
          payoutNumerators: []
        },
        parentOutcome: 0n,
        parentCollectionId: "0x0",
        conditionId: "0x0",
        questionId: "0x0",
        templateId: 2n,
        encodedQuestions: [],
        chainId: 100
      } as never,
      "2026-12-31T23:59:59Z"
    );

    expect(signal.probabilitySource).toBe("seer");
    expect(signal.probability).toBeCloseTo(0.08, 5);
    expect(signal.expectedLoss).toBeCloseTo(8, 5);
  });

  it("marks the signal as unpriced when a market has no derivable probability", () => {
    const signal = normalizeSeerMarket(
      {
        id: "aave-loss",
        label: "Aave depositor loss",
        kind: "exploit",
        type: "categorical",
        severity: 0.2
      },
      undefined,
      "2026-12-31T23:59:59Z"
    );

    expect(signal.probabilitySource).toBe("none");
    expect(signal.probability).toBeNull();
    expect(signal.expectedLoss).toBeNull();
    expect(signal.marketSyncStatus).toBe("missing");
  });
});
