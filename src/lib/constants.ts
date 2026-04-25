const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;

export const APP_TAGLINE = "Defi yields while minimizing exploit risk";
export const APP_DESCRIPTION =
  "A read-only DeFi yield and risk terminal that combines curated opportunities, live protocol APY data, and linked Seer risk markets.";

export const DEFAULT_SEER_API_HOST = viteEnv?.VITE_SEER_API_HOST ?? "https://app.seer.pm";
export const DEFAULT_SEER_CHAIN_ID = Number(viteEnv?.VITE_SEER_CHAIN_ID ?? "100");
export const DEFAULT_RISK_MARKET_CATEGORY = viteEnv?.VITE_SEER_MARKET_CATEGORY ?? "misc";
export const DEFILLAMA_YIELDS_ENDPOINT = "https://yields.llama.fi/pools";
export const DEFILLAMA_PROTOCOL_ENDPOINT = "https://api.llama.fi/protocol";
export const AAVE_V3_GRAPHQL_ENDPOINT = "https://api.v3.aave.com/graphql";

export const CHAIN_LABELS: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  56: "BNB Chain",
  100: "Gnosis",
  137: "Polygon",
  999: "HyperEVM",
  43114: "Avalanche",
  8453: "Base",
  42161: "Arbitrum"
};
