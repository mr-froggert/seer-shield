import { useMemo, useState } from "react";
import { ApyLabel } from "../components/ApyAdjustmentIndicator";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown";
import { PeggedAssetTable } from "../components/PeggedAssetTable";
import { useTerminalData } from "../hooks/useTerminalData";
import { formatChain, formatPercent, formatProbability } from "../lib/format";
import {
  getPeggedAssetMaxApy,
  getPeggedAssetSafetyProbability,
  type PeggedAssetSortBy,
  sortPeggedAssets
} from "../lib/peggedAssetOverview";

export function StablecoinsPage() {
  const { riskAdjustedApy } = useAppPreferences();
  const { stablecoins, isLoading, error } = useTerminalData();
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<PeggedAssetSortBy>("safety");

  const availableChainIds = useMemo(
    () => [...new Set(stablecoins.flatMap((stablecoin) => stablecoin.overviewChains))].sort((left, right) => left - right),
    [stablecoins]
  );

  const filteredStablecoins = useMemo(
    () =>
      selectedChainIds.length === 0
        ? stablecoins
        : stablecoins.filter((stablecoin) =>
            stablecoin.overviewChains.some((chainId) => selectedChainIds.includes(chainId))
          ),
    [selectedChainIds, stablecoins]
  );
  const sortedStablecoins = useMemo(
    () =>
      sortPeggedAssets(filteredStablecoins, {
        sortBy,
        selectedChainIds
      }),
    [filteredStablecoins, selectedChainIds, sortBy]
  );
  const safestStablecoin =
    sortedStablecoins.find((stablecoin) => Number.isFinite(getPeggedAssetSafetyProbability(stablecoin))) ?? null;
  const highestApyStablecoin =
    filteredStablecoins.reduce<typeof filteredStablecoins[number] | null>(
      (best, stablecoin) =>
        getPeggedAssetMaxApy(stablecoin, selectedChainIds) > getPeggedAssetMaxApy(best ?? stablecoin, selectedChainIds)
          ? stablecoin
          : best ?? stablecoin,
      null
    ) ?? null;
  return (
    <main className="page-shell">
      <section className="surface-panel intro-panel">
        <div className="intro-copy">
          <p className="section-kicker">Stablecoins</p>
          <h1 className="page-title">Stablecoin Safety</h1>
          <p className="hero-copy">
            A curated list of DeFi stablecoins, with a summary of their APY, as well as a safety rating. This safety
            rating is computed by{" "}
            <a className="inline-link inline-link-strong" href="https://seer.pm" target="_blank" rel="noreferrer">
              Seer
            </a>{" "}
            prediction markets.
          </p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Safest stablecoin</span>
            <strong className="mono-value">{safestStablecoin?.symbol ?? "Unpriced"}</strong>
            <span className="table-subline">
              {safestStablecoin ? formatProbability(getPeggedAssetSafetyProbability(safestStablecoin)) : "No priced depeg market yet"}
            </span>
          </div>
          <div className="summary-card">
            <span><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY stablecoin</ApyLabel></span>
            <strong className="mono-value">{highestApyStablecoin?.symbol ?? "N/A"}</strong>
            <span className="table-subline value-positive">
              {highestApyStablecoin
                ? formatPercent(getPeggedAssetMaxApy(highestApyStablecoin, selectedChainIds))
                : "No tracked route data"}
            </span>
          </div>
        </div>
      </section>

      <section className="surface-panel table-panel">
        <div className="table-panel-header">
          <div>
            <h2 className="panel-title">Stablecoins</h2>
            <p className="panel-copy">Compare safety, APY range, and issuer context across tracked stablecoins.</p>
          </div>
          <div className="table-controls">
            <div className="field field-inline">
              <label className="control-label" htmlFor="stablecoin-sort">
                Sort by
              </label>
              <select id="stablecoin-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as PeggedAssetSortBy)}>
                <option value="safety">Safety</option>
                <option value="apy">APY range (max APY)</option>
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
        {isLoading ? <div className="callout subtle-callout">Loading linked stablecoin markets…</div> : null}
        {!isLoading && sortedStablecoins.length === 0 ? (
          <div className="callout subtle-callout">No tracked stablecoins match the selected chains.</div>
        ) : null}

        <PeggedAssetTable
          assets={sortedStablecoins}
          assetLabel="Stablecoin"
          showSupportedChains
          selectedChainIds={selectedChainIds}
        />
      </section>
    </main>
  );
}
