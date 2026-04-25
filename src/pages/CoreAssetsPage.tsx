import { useMemo, useState } from "react";
import { ApyLabel } from "../components/ApyAdjustmentIndicator";
import { CoreAssetTable } from "../components/CoreAssetTable";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown";
import { useTerminalData } from "../hooks/useTerminalData";
import { getHighestApyCoreAsset, type CoreAssetSortBy, sortCoreAssets } from "../lib/coreAssetOverview";
import { formatChain, formatPercent } from "../lib/format";
import { getLinkedApyRange } from "../lib/yieldRoutes";

export function CoreAssetsPage() {
  const { riskAdjustedApy } = useAppPreferences();
  const { coreAssets, isLoading, error } = useTerminalData();
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<CoreAssetSortBy>("apy");

  const availableChainIds = useMemo(
    () => [...new Set(coreAssets.flatMap((asset) => asset.overviewChains))].sort((left, right) => left - right),
    [coreAssets]
  );
  const filteredAssets = useMemo(
    () =>
      selectedChainIds.length === 0
        ? coreAssets
        : coreAssets.filter((asset) => asset.overviewChains.some((chainId) => selectedChainIds.includes(chainId))),
    [coreAssets, selectedChainIds]
  );
  const sortedAssets = useMemo(
    () =>
      sortCoreAssets(filteredAssets, {
        sortBy,
        selectedChainIds
      }),
    [filteredAssets, selectedChainIds, sortBy]
  );
  const highestApyAsset = getHighestApyCoreAsset(filteredAssets, selectedChainIds);
  const widestChainAsset =
    filteredAssets.reduce<typeof filteredAssets[number] | null>(
      (widest, asset) => (asset.overviewChains.length > (widest?.overviewChains.length ?? -1) ? asset : widest),
      null
    ) ?? null;
  return (
    <main className="page-shell">
      <section className="surface-panel intro-panel">
        <div className="intro-copy">
          <p className="section-kicker">Core assets</p>
          <h1 className="page-title">Core Asset APY</h1>
          <p className="hero-copy">
            A curated list of DeFi assets, with a summary of their APY and tracked venues. Use this view to compare
            chain coverage and where each asset currently has yield support.
          </p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY asset</ApyLabel></span>
            <strong className="mono-value">{highestApyAsset?.symbol ?? "N/A"}</strong>
            <span className="table-subline value-positive">
              {highestApyAsset
                ? formatPercent(getLinkedApyRange(highestApyAsset, selectedChainIds).max)
                : "No tracked route data"}
            </span>
          </div>
          <div className="summary-card">
            <span>Widest chain coverage</span>
            <strong className="mono-value">{widestChainAsset?.symbol ?? "N/A"}</strong>
            <span className="table-subline">
              {widestChainAsset
                ? `${widestChainAsset.overviewChains.length} observed chain${widestChainAsset.overviewChains.length === 1 ? "" : "s"}`
                : "No chain coverage data"}
            </span>
          </div>
        </div>
      </section>

      <section className="surface-panel table-panel">
        <div className="table-panel-header">
          <div>
            <h2 className="panel-title">Core assets</h2>
            <p className="panel-copy">Review chain coverage, APY ranges, top routes, and linked platforms in one pass.</p>
          </div>
          <div className="table-controls">
            <div className="field field-inline">
              <label className="control-label" htmlFor="core-asset-sort">
                Sort by
              </label>
              <select id="core-asset-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as CoreAssetSortBy)}>
                <option value="apy">Highest APY</option>
                <option value="symbol">Symbol</option>
              </select>
            </div>
            <MultiSelectDropdown
              allLabel="All chains"
              label="Chains"
              options={availableChainIds.map((chainId) => ({
                value: chainId,
                label: formatChain(chainId)
              }))}
              selectedValues={selectedChainIds}
              onChange={setSelectedChainIds}
            />
          </div>
        </div>

        {error ? <div className="callout error-callout">{error.message}</div> : null}
        {isLoading ? <div className="callout subtle-callout">Loading linked core-asset markets…</div> : null}
        {!isLoading && sortedAssets.length === 0 ? (
          <div className="callout subtle-callout">No tracked core assets match the selected chains.</div>
        ) : null}

        <CoreAssetTable assets={sortedAssets} selectedChainIds={selectedChainIds} />
      </section>
    </main>
  );
}
