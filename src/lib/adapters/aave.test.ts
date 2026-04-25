import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeFunctionResult } from "viem";
import { discoverAaveReserveRoutes, fetchOpportunityMetricsFromAave } from "./aave";

const umbrellaAbi = [
  {
    type: "function",
    name: "getStakeData",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "price", type: "uint256" },
          { name: "totalAssets", type: "uint256" },
          { name: "targetLiquidity", type: "uint256" },
          { name: "underlyingTokenAddress", type: "address" },
          { name: "underlyingTokenName", type: "string" },
          { name: "underlyingTokenSymbol", type: "string" },
          { name: "underlyingTokenDecimals", type: "uint8" },
          { name: "cooldownSeconds", type: "uint256" },
          { name: "unstakeWindowSeconds", type: "uint256" },
          { name: "underlyingIsStataToken", type: "bool" },
          {
            name: "stataTokenData",
            type: "tuple",
            components: [
              { name: "asset", type: "address" },
              { name: "assetName", type: "string" },
              { name: "assetSymbol", type: "string" },
              { name: "aToken", type: "address" },
              { name: "aTokenName", type: "string" },
              { name: "aTokenSymbol", type: "string" }
            ]
          },
          {
            name: "rewards",
            type: "tuple[]",
            components: [
              { name: "rewardAddress", type: "address" },
              { name: "rewardName", type: "string" },
              { name: "rewardSymbol", type: "string" },
              { name: "price", type: "uint256" },
              { name: "decimals", type: "uint8" },
              { name: "index", type: "uint256" },
              { name: "maxEmissionPerSecond", type: "uint256" },
              { name: "distributionEnd", type: "uint256" },
              { name: "currentEmissionPerSecond", type: "uint256" },
              { name: "apy", type: "uint256" }
            ]
          }
        ]
      }
    ]
  }
] as const;

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload
  };
}

describe("Aave adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("combines base reserve APY with supply incentives from the Aave app API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse({
          data: {
            markets: [
              {
                name: "AaveV3Ethereum",
                address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
                chain: {
                  chainId: 1,
                  name: "Ethereum"
                },
                supplyReserves: [
                  {
                    underlyingToken: {
                      address: "0xdC035D45d973E3EC169d2276DDab16f1e407384F",
                      symbol: "USDS",
                      name: "USDS Stablecoin",
                      chainId: 1
                    },
                    supplyInfo: {
                      apy: {
                        value: "0.022962131561790722475011281",
                        formatted: "2.30"
                      }
                    },
                    incentives: [
                      {
                        __typename: "AaveSupplyIncentive",
                        extraSupplyApr: {
                          value: "0.0540928103596025635570403097",
                          formatted: "5.41"
                        },
                        rewardTokenSymbol: "aEthUSDS",
                        rewardTokenAddress: "0x32a6268f9Ba3642Dda7892aDd74f1D34469A4259"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        })
      )
    );

    const metrics = await fetchOpportunityMetricsFromAave({
      chainId: 1,
      yieldSourceId: "reserve:0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2:0xdC035D45d973E3EC169d2276DDab16f1e407384F"
    });

    expect(metrics.source).toBe("aave");
    expect(metrics.apyBase).toBeCloseTo(2.2962, 3);
    expect(metrics.apyReward).toBeCloseTo(5.4092, 3);
    expect(metrics.grossApy).toBeCloseTo(7.7054, 3);
    expect(metrics.rewardTokens).toEqual(["aEthUSDS"]);
    expect(metrics.url).toContain("underlyingAsset=0xdC035D45d973E3EC169d2276DDab16f1e407384F");
  });

  it("discovers all live Aave reserve routes for an asset across the requested chains", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse({
          data: {
            markets: [
              {
                name: "AaveV3Ethereum",
                address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
                chain: {
                  chainId: 1,
                  name: "Ethereum"
                },
                supplyReserves: [
                  {
                    underlyingToken: {
                      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                      symbol: "USDC",
                      name: "USD Coin",
                      chainId: 1
                    },
                    supplyInfo: {
                      apy: {
                        value: "0.031",
                        formatted: "3.10"
                      }
                    },
                    incentives: []
                  }
                ]
              },
              {
                name: "AaveV3Arbitrum",
                address: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
                chain: {
                  chainId: 42161,
                  name: "Arbitrum"
                },
                supplyReserves: [
                  {
                    underlyingToken: {
                      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
                      symbol: "USDC",
                      name: "USD Coin",
                      chainId: 42161
                    },
                    supplyInfo: {
                      apy: {
                        value: "0.0475",
                        formatted: "4.75"
                      }
                    },
                    incentives: [
                      {
                        __typename: "AaveSupplyIncentive",
                        extraSupplyApr: {
                          value: "0.005",
                          formatted: "0.50"
                        },
                        rewardTokenSymbol: "ARB",
                        rewardTokenAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548"
                      }
                    ]
                  },
                  {
                    underlyingToken: {
                      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
                      symbol: "USDC",
                      name: "Bridged USDC (Arbitrum)",
                      chainId: 42161
                    },
                    supplyInfo: {
                      apy: {
                        value: "0.025",
                        formatted: "2.50"
                      }
                    },
                    incentives: []
                  }
                ]
              }
            ]
          }
        })
      )
    );

    const routes = await discoverAaveReserveRoutes({
      assetSymbol: "USDC",
      chainIds: [1, 42161]
    });

    expect(routes).toHaveLength(3);
    expect(routes.map((route) => route.sourceId)).toEqual([
      "reserve:0x794a61358D6845594F94dc1DB02A252b5b4814aD:0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      "reserve:0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "reserve:0x794a61358D6845594F94dc1DB02A252b5b4814aD:0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
    ]);
    expect(routes[0]?.metrics.grossApy).toBeCloseTo(5.25, 3);
    expect(routes[0]?.metrics.rewardTokens).toEqual(["ARB"]);
    expect(routes[2]?.tokenName).toBe("Bridged USDC (Arbitrum)");
  });

  it("uses the official current sGHO Merit APR for Aave savings routes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("apps.aavechan.com/api/merit/aprs")) {
          return Promise.resolve(
            createJsonResponse({
              currentAPR: {
                actionsAPR: {
                  "ethereum-sgho": 6.745778197846081
                }
              }
            })
          );
        }

        if (url.includes("app.aave.com/api/sgho-apy/")) {
          return Promise.resolve(
            createJsonResponse({
              data: [
                {
                  day: {
                    value: "2026-04-23"
                  },
                  merit_apy: 0.06744521694679334
                }
              ]
            })
          );
        }

        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      })
    );

    const metrics = await fetchOpportunityMetricsFromAave({
      chainId: 1,
      yieldSourceId: "savings:ethereum:gho"
    });

    expect(metrics.label).toBe("Aave sGHO Savings / GHO");
    expect(metrics.apyBase).toBe(0);
    expect(metrics.apyReward).toBeCloseTo(6.7458, 3);
    expect(metrics.grossApy).toBeCloseTo(6.7458, 3);
    expect(metrics.rewardTokens).toEqual(["GHO"]);
    expect(metrics.url).toBe("https://app.aave.com/sgho/");
  });

  it("decodes Aave Umbrella stake data and exposes the live reward APY", async () => {
    const encodedResult = encodeFunctionResult({
      abi: umbrellaAbi,
      functionName: "getStakeData",
      result: [
        {
          tokenAddress: "0x4f827A63755855cDf3e8f3bcD20265C833f15033",
          name: "Umbrella Stake Gho Token v1",
          symbol: "stkGHO.v1",
          price: 100000000n,
          totalAssets: 15479793933373608282314420n,
          targetLiquidity: 12000000000000000000000000n,
          underlyingTokenAddress: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
          underlyingTokenName: "Gho Token",
          underlyingTokenSymbol: "GHO",
          underlyingTokenDecimals: 18,
          cooldownSeconds: 1728000n,
          unstakeWindowSeconds: 172800n,
          underlyingIsStataToken: false,
          stataTokenData: {
            asset: "0x0000000000000000000000000000000000000000",
            assetName: "",
            assetSymbol: "",
            aToken: "0x0000000000000000000000000000000000000000",
            aTokenName: "",
            aTokenSymbol: ""
          },
          rewards: [
            {
              rewardAddress: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
              rewardName: "Gho Token",
              rewardSymbol: "GHO",
              price: 100000000n,
              decimals: 18,
              index: 62041045194078229n,
              maxEmissionPerSecond: 38051750380517503n,
              distributionEnd: 1780659599n,
              currentEmissionPerSecond: 30441400304414002n,
              apy: 620n
            }
          ]
        }
      ]
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse({
          jsonrpc: "2.0",
          id: 1,
          result: encodedResult
        })
      )
    );

    const metrics = await fetchOpportunityMetricsFromAave({
      chainId: 1,
      yieldSourceId: "umbrella:ethereum:gho"
    });

    expect(metrics.label).toBe("Aave Umbrella / stkGHO.v1");
    expect(metrics.apyBase).toBe(0);
    expect(metrics.apyReward).toBeCloseTo(6.2, 3);
    expect(metrics.grossApy).toBeCloseTo(6.2, 3);
    expect(metrics.tvlUsd).toBeCloseTo(15479793.93, 2);
    expect(metrics.rewardTokens).toEqual(["GHO"]);
    expect(metrics.url).toBe("https://app.aave.com/staking/");
  });

  it("adds the underlying Aave reserve APY for stata-backed Umbrella routes", async () => {
    const encodedResult = encodeFunctionResult({
      abi: umbrellaAbi,
      functionName: "getStakeData",
      result: [
        {
          tokenAddress: "0x1111111111111111111111111111111111111111",
          name: "Umbrella Stake Wrapped Aave Ethereum USDC v1",
          symbol: "stkwaEthUSDC.v1",
          price: 100000000n,
          totalAssets: 1000000000000000000000000n,
          targetLiquidity: 800000000000000000000000n,
          underlyingTokenAddress: "0x2222222222222222222222222222222222222222",
          underlyingTokenName: "Wrapped Aave Ethereum USDC",
          underlyingTokenSymbol: "waEthUSDC",
          underlyingTokenDecimals: 18,
          cooldownSeconds: 1728000n,
          unstakeWindowSeconds: 172800n,
          underlyingIsStataToken: true,
          stataTokenData: {
            asset: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            assetName: "USD Coin",
            assetSymbol: "USDC",
            aToken: "0x4d5f47fa6a74757f35c14fd3a6ef8e3c9bc514e8",
            aTokenName: "Aave Ethereum USDC",
            aTokenSymbol: "aEthUSDC"
          },
          rewards: [
            {
              rewardAddress: "0x4d5f47fa6a74757f35c14fd3a6ef8e3c9bc514e8",
              rewardName: "Aave Ethereum USDC",
              rewardSymbol: "aEthUSDC",
              price: 100000000n,
              decimals: 6,
              index: 1n,
              maxEmissionPerSecond: 1n,
              distributionEnd: 1780659599n,
              currentEmissionPerSecond: 1n,
              apy: 276n
            }
          ]
        }
      ]
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "https://1rpc.io/eth") {
          return Promise.resolve(
            createJsonResponse({
              jsonrpc: "2.0",
              id: 1,
              result: encodedResult
            })
          );
        }

        if (url === "https://api.v3.aave.com/graphql") {
          return Promise.resolve(
            createJsonResponse({
              data: {
                markets: [
                  {
                    name: "AaveV3Ethereum",
                    address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
                    chain: {
                      chainId: 1,
                      name: "Ethereum"
                    },
                    supplyReserves: [
                      {
                        underlyingToken: {
                          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                          symbol: "USDC",
                          name: "USD Coin",
                          chainId: 1
                        },
                        supplyInfo: {
                          apy: {
                            value: "0.1285",
                            formatted: "12.85"
                          }
                        },
                        incentives: []
                      }
                    ]
                  }
                ]
              }
            })
          );
        }

        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      })
    );

    const metrics = await fetchOpportunityMetricsFromAave({
      chainId: 1,
      yieldSourceId: "umbrella:ethereum:waethusdc"
    });

    expect(metrics.label).toBe("Aave Umbrella / stkwaEthUSDC.v1");
    expect(metrics.apyBase).toBeCloseTo(12.85, 2);
    expect(metrics.apyReward).toBeCloseTo(2.76, 2);
    expect(metrics.grossApy).toBeCloseTo(15.61, 2);
    expect(metrics.rewardTokens).toEqual(["aEthUSDC"]);
  });
});
