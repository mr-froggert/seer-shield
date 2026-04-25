import { getConfidencePriority } from "./overview";
import { getPrimaryPeggedAssetSignal } from "./peggedAssets";
import { getLinkedApyRange } from "./yieldRoutes";
import type { PeggedAssetOverviewViewModel } from "./types";

export type PeggedAssetSortBy = "safety" | "apy";

function compareConfidence(
  left: Pick<PeggedAssetOverviewViewModel, "riskProfile">,
  right: Pick<PeggedAssetOverviewViewModel, "riskProfile">
) {
  return getConfidencePriority(right.riskProfile.confidence) - getConfidencePriority(left.riskProfile.confidence);
}

export function getPeggedAssetSafetyProbability(asset: Pick<PeggedAssetOverviewViewModel, "riskProfile">) {
  return getPrimaryPeggedAssetSignal(asset)?.probability ?? Number.POSITIVE_INFINITY;
}

export function getPeggedAssetMaxApy(
  asset: Pick<PeggedAssetOverviewViewModel, "linkedOpportunityRoutes">,
  selectedChainIds: number[] = []
) {
  return getLinkedApyRange(asset, selectedChainIds).max ?? Number.NEGATIVE_INFINITY;
}

export function sortPeggedAssets<T extends PeggedAssetOverviewViewModel>(
  assets: T[],
  options: {
    sortBy: PeggedAssetSortBy;
    selectedChainIds?: number[];
    tieBreaker?: (left: T, right: T) => number;
  }
) {
  const { sortBy, selectedChainIds = [], tieBreaker } = options;

  return [...assets].sort((left, right) => {
    const leftSafety = getPeggedAssetSafetyProbability(left);
    const rightSafety = getPeggedAssetSafetyProbability(right);
    const leftMaxApy = getPeggedAssetMaxApy(left, selectedChainIds);
    const rightMaxApy = getPeggedAssetMaxApy(right, selectedChainIds);

    if (sortBy === "apy" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    if (leftSafety !== rightSafety) {
      return leftSafety - rightSafety;
    }

    const confidenceDifference = compareConfidence(left, right);

    if (confidenceDifference !== 0) {
      return confidenceDifference;
    }

    if (sortBy === "safety" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    if (tieBreaker) {
      const tieBreakerDifference = tieBreaker(left, right);

      if (tieBreakerDifference !== 0) {
        return tieBreakerDifference;
      }
    }

    return left.symbol.localeCompare(right.symbol);
  });
}
