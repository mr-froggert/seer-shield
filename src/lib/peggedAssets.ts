import type { Asset, PeggedAssetOverviewViewModel, RiskSignal } from "./types";

export function isStablecoinAsset(asset: Pick<Asset, "type" | "tags">) {
  return asset.type === "stablecoin" || asset.tags.includes("stablecoin");
}

export function isTokenizedBtcAsset(asset: Pick<Asset, "type" | "tags">) {
  return asset.type === "tokenized-btc" || asset.tags.includes("tokenized-btc");
}

export function isCoreAsset(asset: Pick<Asset, "type" | "tags">) {
  return asset.type === "core-asset" || asset.tags.includes("core-asset");
}

export function isPeggedAsset(asset: Pick<Asset, "type" | "tags">) {
  return isStablecoinAsset(asset) || isTokenizedBtcAsset(asset);
}

export function getAssetDetailHref(asset: Pick<Asset, "id" | "type" | "tags">) {
  if (isStablecoinAsset(asset)) {
    return `/stablecoins/${asset.id}`;
  }

  if (isTokenizedBtcAsset(asset)) {
    return `/tokenized-btc/${asset.id}`;
  }

  if (isCoreAsset(asset)) {
    return `/core-assets/${asset.id}`;
  }

  return null;
}

export function getPeggedAssetDetailHref(asset: Pick<Asset, "id" | "type" | "tags">) {
  return isPeggedAsset(asset) ? getAssetDetailHref(asset) : null;
}

export function getPrimaryPeggedAssetSignal(asset: Pick<PeggedAssetOverviewViewModel, "riskProfile">): RiskSignal | null {
  return asset.riskProfile.signals.find((signal) => signal.kind === "depeg") ?? asset.riskProfile.signals[0] ?? null;
}
