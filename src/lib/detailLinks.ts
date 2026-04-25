import type { Asset, Protocol, ProtocolMetrics } from "./types";

export function getCoinGeckoAssetUrl(asset: Pick<Asset, "coingeckoId">) {
  return asset.coingeckoId ? `https://www.coingecko.com/en/coins/${encodeURIComponent(asset.coingeckoId)}` : null;
}

export function getProtocolDefiLlamaUrl(
  protocol: Pick<Protocol, "defillamaProjectId"> & {
    protocolMetrics?: Pick<ProtocolMetrics, "url"> | null;
  }
) {
  return protocol.protocolMetrics?.url ?? (
    protocol.defillamaProjectId ? `https://defillama.com/yields?project=${encodeURIComponent(protocol.defillamaProjectId)}` : null
  );
}

export function getAssetDefiLlamaUrl(asset: Pick<Asset, "symbol" | "yieldDiscoverySymbol">) {
  const symbol = asset.yieldDiscoverySymbol ?? asset.symbol;
  return symbol ? `https://defillama.com/yields?symbol=${encodeURIComponent(symbol)}` : null;
}
