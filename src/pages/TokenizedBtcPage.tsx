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

function getSupportedChainCount(asset: ReturnType<typeof useTerminalData>["tokenizedBtc"][number]) {
  return asset.chains.length;
}

export function TokenizedBtcPage() {
  const { riskAdjustedApy } = useAppPreferences();
  const { tokenizedBtc, isLoading, error } = useTerminalData();
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<PeggedAssetSortBy>("safety");

  const availableChainIds = useMemo(
    () => [...new Set(tokenizedBtc.flatMap((asset) => asset.overviewChains))].sort((left, right) => left - right),
    [tokenizedBtc]
  );
  const filteredAssets = useMemo(
    () =>
      selectedChainIds.length === 0
        ? tokenizedBtc
        : tokenizedBtc.filter((asset) => asset.overviewChains.some((chainId) => selectedChainIds.includes(chainId))),
    [selectedChainIds, tokenizedBtc]
  );
  const sortedAssets = useMemo(
    () =>
      sortPeggedAssets(filteredAssets, {
        sortBy,
        selectedChainIds,
        tieBreaker: (left, right) => getSupportedChainCount(right) - getSupportedChainCount(left)
      }),
    [filteredAssets, selectedChainIds, sortBy]
  );
  const safestWrapper = sortedAssets.find((asset) => Number.isFinite(getPeggedAssetSafetyProbability(asset))) ?? null;
  const highestApyWrapper =
    filteredAssets.reduce<typeof filteredAssets[number] | null>(
      (best, asset) =>
        getPeggedAssetMaxApy(asset, selectedChainIds) > getPeggedAssetMaxApy(best ?? asset, selectedChainIds)
          ? asset
          : best ?? asset,
      null
    ) ?? null;
  return (
    <main className="page-shell">
      <section className="surface-panel intro-panel">
        <div className="intro-copy">
          <p className="section-kicker">Tokenized BTC</p>
          <h1 className="page-title">BTC Wrapper Safety</h1>
          <p className="hero-copy">
            A curated list of BTC wrappers in DeFi, with a summary of their APY, as well as a safety rating. This
            safety rating is computed by{" "}
            <a className="inline-link inline-link-strong" href="https://seer.pm" target="_blank" rel="noreferrer">
              Seer
            </a>{" "}
            prediction markets.
          </p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Safest wrapper</span>
            <strong className="mono-value">{safestWrapper?.symbol ?? "Unpriced"}</strong>
            <span className="table-subline">
              {safestWrapper ? formatProbability(getPeggedAssetSafetyProbability(safestWrapper)) : "No priced BTC-peg market yet"}
            </span>
          </div>
          <div className="summary-card">
            <span><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY wrapper</ApyLabel></span>
            <strong className="mono-value">{highestApyWrapper?.symbol ?? "N/A"}</strong>
            <span className="table-subline value-positive">
              {highestApyWrapper
                ? formatPercent(getPeggedAssetMaxApy(highestApyWrapper, selectedChainIds))
                : "No tracked route data"}
            </span>
          </div>
        </div>
      </section>

      <section className="surface-panel table-panel">
        <div className="table-panel-header">
          <div>
            <h2 className="panel-title">Tokenized BTC</h2>
            <p className="panel-copy">Compare peg safety, supported chains, APY range, and issuer context at a glance.</p>
          </div>
          <div className="table-controls">
            <div className="field field-inline">
              <label className="control-label" htmlFor="tokenized-btc-sort">
                Sort by
              </label>
              <select id="tokenized-btc-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as PeggedAssetSortBy)}>
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
        {isLoading ? <div className="callout subtle-callout">Loading linked BTC wrapper markets…</div> : null}
        {!isLoading && sortedAssets.length === 0 ? (
          <div className="callout subtle-callout">No tracked BTC wrappers match the selected chains.</div>
        ) : null}

        <PeggedAssetTable assets={sortedAssets} assetLabel="Wrapper" showSupportedChains selectedChainIds={selectedChainIds} />
      </section>
    </main>
  );
}
