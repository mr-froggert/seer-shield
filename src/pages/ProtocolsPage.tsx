import { useMemo, useState } from "react";
import { ApyLabel } from "../components/ApyAdjustmentIndicator";
import { ProtocolTable, type ProtocolRow } from "../components/ProtocolTable";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown";
import { useTerminalData } from "../hooks/useTerminalData";
import { getConfidencePriority } from "../lib/overview";
import { formatChain, formatPercent, formatUsd } from "../lib/format";
import { PLATFORM_SURFACE_TAG } from "../lib/platforms";
import { getProtocolLinkedMaxApy } from "../lib/yieldRoutes";
type ProtocolSortBy = "safety" | "apy";

function getProtocolSafety(protocol: ProtocolRow["protocol"]) {
  if (protocol.riskProfile.coverage.priced === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return protocol.riskProfile.expectedLossThroughExpiry ?? Number.POSITIVE_INFINITY;
}

function getProtocolMaxApy(protocol: ProtocolRow["protocol"], adjustedApyEnabled: boolean) {
  return getProtocolLinkedMaxApy(protocol, adjustedApyEnabled) ?? Number.NEGATIVE_INFINITY;
}

function sortProtocolRows(rows: ProtocolRow[], sortBy: ProtocolSortBy, adjustedApyEnabled: boolean) {
  return [...rows].sort((left, right) => {
    const leftSafety = getProtocolSafety(left.protocol);
    const rightSafety = getProtocolSafety(right.protocol);
    const leftMaxApy = getProtocolMaxApy(left.protocol, adjustedApyEnabled);
    const rightMaxApy = getProtocolMaxApy(right.protocol, adjustedApyEnabled);

    if (sortBy === "apy" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    if (leftSafety !== rightSafety) {
      return leftSafety - rightSafety;
    }

    const confidenceDifference =
      getConfidencePriority(right.protocol.riskProfile.confidence) -
      getConfidencePriority(left.protocol.riskProfile.confidence);

    if (confidenceDifference !== 0) {
      return confidenceDifference;
    }

    if (sortBy === "safety" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    const leftTvl = left.protocol.protocolMetrics?.totalTvlUsd ?? Number.NEGATIVE_INFINITY;
    const rightTvl = right.protocol.protocolMetrics?.totalTvlUsd ?? Number.NEGATIVE_INFINITY;

    if (leftTvl !== rightTvl) {
      return rightTvl - leftTvl;
    }

    return left.protocol.name.localeCompare(right.protocol.name);
  });
}

export function ProtocolsPage() {
  const { riskAdjustedApy } = useAppPreferences();
  const { protocols, isLoading, error } = useTerminalData();
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<ProtocolSortBy>("safety");

  const platformRows = useMemo<ProtocolRow[]>(
    () =>
      protocols
        .filter((protocol) => protocol.tags.includes(PLATFORM_SURFACE_TAG))
        .map((protocol) => ({ protocol })),
    [protocols]
  );
  const availableChainIds = useMemo(
    () => [...new Set(platformRows.flatMap((row) => row.protocol.overviewChains))].sort((left, right) => left - right),
    [platformRows]
  );
  const filteredRows = useMemo(
    () =>
      selectedChainIds.length === 0
        ? platformRows
        : platformRows.filter((row) => row.protocol.overviewChains.some((chainId) => selectedChainIds.includes(chainId))),
    [platformRows, selectedChainIds]
  );
  const protocolRows = useMemo(
    () => sortProtocolRows(filteredRows, sortBy, riskAdjustedApy.enabled),
    [filteredRows, riskAdjustedApy.enabled, sortBy]
  );

  const highestApyPlatform =
    filteredRows.reduce<ProtocolRow | null>((best, row) => {
      if (best === null) {
        return row;
      }

      return getProtocolMaxApy(row.protocol, riskAdjustedApy.enabled) > getProtocolMaxApy(best.protocol, riskAdjustedApy.enabled)
        ? row
        : best;
    }, null) ?? null;
  const highestTvlPlatform =
    filteredRows.reduce<ProtocolRow | null>((best, row) => {
      if (best === null) {
        return row;
      }

      return (row.protocol.protocolMetrics?.totalTvlUsd ?? Number.NEGATIVE_INFINITY) >
        (best.protocol.protocolMetrics?.totalTvlUsd ?? Number.NEGATIVE_INFINITY)
        ? row
        : best;
    }, null) ?? null;

  return (
    <main className="page-shell">
      <section className="surface-panel intro-panel">
        <div className="intro-copy">
          <p className="section-kicker">Platforms</p>
          <h1 className="page-title">Platform Safety</h1>
          <p className="hero-copy">
            A curated list of DeFi protocols, with a summary of their APY, as well as a safety rating. This safety
            rating is computed by{" "}
            <a className="inline-link inline-link-strong" href="https://seer.pm" target="_blank" rel="noreferrer">
              Seer
            </a>{" "}
            prediction markets.
          </p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY platform</ApyLabel></span>
            <strong className="mono-value">
              {highestApyPlatform ? (
                <a className="inline-link inline-link-strong" href={highestApyPlatform.protocol.website} target="_blank" rel="noreferrer">
                  {highestApyPlatform.protocol.name}
                </a>
              ) : (
                "N/A"
              )}
            </strong>
            <span className="table-subline value-positive">
              {highestApyPlatform
                ? formatPercent(getProtocolMaxApy(highestApyPlatform.protocol, riskAdjustedApy.enabled))
                : "No tracked route data"}
            </span>
          </div>
          <div className="summary-card">
            <span>Highest TVL platform</span>
            <strong className="mono-value">
              {highestTvlPlatform ? (
                <a className="inline-link inline-link-strong" href={highestTvlPlatform.protocol.website} target="_blank" rel="noreferrer">
                  {highestTvlPlatform.protocol.name}
                </a>
              ) : (
                "N/A"
              )}
            </strong>
            <span className="table-subline">
              {highestTvlPlatform?.protocol.protocolMetrics?.totalTvlUsd != null
                ? formatUsd(highestTvlPlatform.protocol.protocolMetrics.totalTvlUsd)
                : "No TVL data"}
            </span>
          </div>
        </div>
      </section>

      <section className="surface-panel table-panel">
        <div className="table-panel-header">
          <div>
            <h2 className="panel-title">Platforms</h2>
            <p className="panel-copy">Compare safety, APY range, and TVL across the tracked platform set.</p>
          </div>
          <div className="table-controls">
            <div className="field field-inline">
              <label className="control-label" htmlFor="platform-sort">
                Sort by
              </label>
              <select id="platform-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as ProtocolSortBy)}>
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
        {isLoading ? <div className="callout subtle-callout">Loading live metrics and protocol markets…</div> : null}
        {!isLoading && protocolRows.length === 0 ? (
          <div className="callout subtle-callout">No tracked platforms match the selected chains.</div>
        ) : null}

        <ProtocolTable rows={protocolRows} />
      </section>
    </main>
  );
}
