import { getFilteredLinkedRoutes, getLinkedApyRange } from "./yieldRoutes";
import type { CoreAssetOverviewViewModel } from "./types";

export type CoreAssetSortBy = "apy" | "symbol";

function getCoreAssetMaxApy(
  asset: Pick<CoreAssetOverviewViewModel, "linkedOpportunityRoutes">,
  selectedChainIds: number[]
) {
  return getLinkedApyRange(asset, selectedChainIds).max ?? Number.NEGATIVE_INFINITY;
}

function getCoreAssetProtocolCount(
  asset: Pick<CoreAssetOverviewViewModel, "linkedOpportunityRoutes">,
  selectedChainIds: number[]
) {
  return new Set(getFilteredLinkedRoutes(asset, selectedChainIds).map((route) => route.opportunity.protocol.id)).size;
}

export function sortCoreAssets<T extends CoreAssetOverviewViewModel>(
  assets: T[],
  options: {
    sortBy: CoreAssetSortBy;
    selectedChainIds?: number[];
  }
) {
  const { sortBy, selectedChainIds = [] } = options;

  return [...assets].sort((left, right) => {
    const leftMaxApy = getCoreAssetMaxApy(left, selectedChainIds);
    const rightMaxApy = getCoreAssetMaxApy(right, selectedChainIds);

    if (sortBy === "apy" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    if (sortBy === "symbol") {
      return left.symbol.localeCompare(right.symbol);
    }

    if (leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    const leftProtocolCount = getCoreAssetProtocolCount(left, selectedChainIds);
    const rightProtocolCount = getCoreAssetProtocolCount(right, selectedChainIds);

    if (leftProtocolCount !== rightProtocolCount) {
      return rightProtocolCount - leftProtocolCount;
    }

    return left.symbol.localeCompare(right.symbol);
  });
}

export function getHighestApyCoreAsset<T extends CoreAssetOverviewViewModel>(
  assets: T[],
  selectedChainIds: number[] = []
) {
  return assets.reduce<T | null>((best, asset) => {
    const assetMaxApy = getCoreAssetMaxApy(asset, selectedChainIds);

    if (!best) {
      return asset;
    }

    const bestMaxApy = getCoreAssetMaxApy(best, selectedChainIds);

    if (assetMaxApy !== bestMaxApy) {
      return assetMaxApy > bestMaxApy ? asset : best;
    }

    return best.symbol.localeCompare(asset.symbol) <= 0 ? best : asset;
  }, null);
}
