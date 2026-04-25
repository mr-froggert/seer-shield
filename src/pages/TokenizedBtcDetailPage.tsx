import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApyLabel } from "../components/ApyAdjustmentIndicator";
import { EntityLogo } from "../components/EntityLogo";
import { LinkedMarketsPanel } from "../components/LinkedMarketsPanel";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown";
import { ProtocolBadgeGroup } from "../components/ProtocolBadgeGroup";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { useTerminalData } from "../hooks/useTerminalData";
import { getAssetDefiLlamaUrl, getCoinGeckoAssetUrl } from "../lib/detailLinks";
import { formatChain, formatDate, formatPercent, formatProbability } from "../lib/format";
import { getRouteSummaryUrl } from "../lib/opportunityLinks";
import { getPrimaryPeggedAssetSignal } from "../lib/peggedAssets";
import { handleTableRowClick, handleTableRowKeyDown } from "../lib/tableRowNavigation";
import {
  buildYieldAssetProtocolRows,
  sortRoutesByApyThenTitle,
  sortYieldAssetProtocolRows,
  type YieldAssetProtocolSortBy
} from "../lib/yieldAssetDetail";
import { getFilteredLinkedRoutes, getHighestLinkedApyRoute, getLinkedApyRange } from "../lib/yieldRoutes";
import type { TokenizedBtcOverviewViewModel } from "../lib/types";

function getRealMarkets(asset: TokenizedBtcOverviewViewModel["linkedMarkets"]) {
  return asset.filter((market) => market.signal.marketSyncStatus === "created" && Boolean(market.signal.url));
}

export function TokenizedBtcDetailPage() {
  const { riskAdjustedApy } = useAppPreferences();
  const { id } = useParams();
  const navigate = useNavigate();
  const { protocols, tokenizedBtc } = useTerminalData();
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<YieldAssetProtocolSortBy>("safety");
  const asset = tokenizedBtc.find((entry) => entry.id === id);

  if (!asset) {
    return (
      <main className="page-shell">
        <div className="callout error-callout">
          Tokenized BTC wrapper not found. <Link to="/tokenized-btc">Return to the tokenized BTC table.</Link>
        </div>
      </main>
    );
  }

  const primarySignal = getPrimaryPeggedAssetSignal(asset);
  const availableChainIds = asset.overviewChains;
  const protocolMap = useMemo(() => new Map(protocols.map((protocol) => [protocol.id, protocol])), [protocols]);
  const filteredRoutes = useMemo(() => getFilteredLinkedRoutes(asset, selectedChainIds), [asset, selectedChainIds]);
  const sortedRoutes = useMemo(() => [...filteredRoutes].sort(sortRoutesByApyThenTitle), [filteredRoutes]);
  const protocolRows = useMemo(
    () => sortYieldAssetProtocolRows(buildYieldAssetProtocolRows(sortedRoutes, protocolMap), sortBy),
    [protocolMap, sortedRoutes, sortBy]
  );
  const apyRange = getLinkedApyRange(asset, selectedChainIds);
  const topYieldRoute = getHighestLinkedApyRoute(asset, selectedChainIds);
  const topYieldRouteUrl = getRouteSummaryUrl(topYieldRoute);
  const defillamaUrl = getAssetDefiLlamaUrl(asset);
  const coinGeckoUrl = getCoinGeckoAssetUrl(asset);
  const realMarkets = getRealMarkets(asset.linkedMarkets);

  return (
    <main className="page-shell">
      <section className="surface-panel intro-panel">
        <div className="intro-copy">
          <div className="intro-heading">
            <EntityLogo
              name={asset.symbol}
              website={asset.website ?? asset.issuerProtocol.website}
              imageUrl={asset.logoUrl ?? asset.issuerProtocol.logoUrl}
              size="lg"
              className="detail-logo"
            />
            <div className="intro-title-block">
              <p className="section-kicker">BTC wrapper</p>
              <h1 className="page-title">{asset.symbol}</h1>
            </div>
          </div>
          <p className="hero-copy">
            {asset.description ?? `${asset.name} is tracked as a bitcoin wrapper with explicit issuer and peg-risk context.`}
          </p>
          <ProtocolBadgeGroup items={asset.tags} className="detail-badge-row" />
          <div className="detail-actions">
            <a
              className="inline-link inline-link-strong"
              href={asset.website ?? asset.issuerProtocol.website}
              target="_blank"
              rel="noreferrer"
            >
              Website
            </a>
            {defillamaUrl ? (
              <a className="inline-link inline-link-strong" href={defillamaUrl} target="_blank" rel="noreferrer">
                DefiLlama
              </a>
            ) : null}
            {coinGeckoUrl ? (
              <a className="inline-link inline-link-strong" href={coinGeckoUrl} target="_blank" rel="noreferrer">
                CoinGecko
              </a>
            ) : null}
          </div>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Depeg risk</span>
            <strong className="mono-value value-risk">{formatProbability(primarySignal?.probability)}</strong>
            <span className="table-subline">
              {primarySignal == null
                ? "No depeg market configured"
                : `${primarySignal.label}${primarySignal.horizonEnd ? ` by ${formatDate(primarySignal.horizonEnd)}` : ""}`}
            </span>
            {primarySignal?.url ? (
              <a className="secondary-button compact-action-button" href={primarySignal.url} target="_blank" rel="noreferrer">
                Trade on Seer
              </a>
            ) : null}
          </div>
          <div className="summary-card">
            <span><ApyLabel showAdjustment={riskAdjustedApy.enabled}>APY range</ApyLabel></span>
            <strong className="mono-value value-positive">{apyRange.label}</strong>
            <span className="table-subline">
              {sortedRoutes.length === 0
                ? selectedChainIds.length === 0
                  ? "No tracked APY yet"
                  : "No tracked APY on selected chains"
                : `Across ${sortedRoutes.length} tracked route${sortedRoutes.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="summary-card">
            <span><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY route</ApyLabel></span>
            <strong className="mono-value">{topYieldRoute?.opportunity.protocol.name ?? "No route"}</strong>
            {topYieldRoute ? (
              topYieldRouteUrl ? (
                <a className="table-link table-subline" href={topYieldRouteUrl} target="_blank" rel="noreferrer">
                  {topYieldRoute.opportunity.title}
                </a>
              ) : (
                <span className="table-subline">{topYieldRoute.opportunity.title}</span>
              )
            ) : (
              <span className="table-subline">No tracked opportunity for this wrapper</span>
            )}
          </div>
          <div className="summary-card">
            <span>Observed chains</span>
            <strong className="mono-value">{asset.overviewChains.length}</strong>
            <span className="table-subline">{asset.overviewChains.map((chainId) => formatChain(chainId)).join(", ")}</span>
          </div>
        </div>
      </section>

      <section className="surface-panel detail-support-panel detail-table-panel">
        <div className="card-header">
          <div>
            <p className="section-kicker">Tracked venues</p>
            <h3>Routes for {asset.symbol}</h3>
          </div>
          <div className="table-controls">
            <div className="field field-inline">
              <label className="control-label" htmlFor="tokenized-btc-detail-sort">
                Sort by
              </label>
              <select
                id="tokenized-btc-detail-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as YieldAssetProtocolSortBy)}
              >
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
        {protocolRows.length === 0 ? (
          <div className="callout subtle-callout">
            {selectedChainIds.length === 0
              ? "No tracked yield route is configured for this BTC wrapper yet."
              : "No tracked yield route is available on the selected chains."}
          </div>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Exploit Risk</th>
                  <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>APY range</ApyLabel></th>
                  <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY route</ApyLabel></th>
                  <th>Chains</th>
                </tr>
              </thead>
              <tbody>
                {protocolRows.map((row, index) => (
                  <tr
                    key={row.protocol.id}
                    className={`table-row-clickable${index % 2 === 1 ? " table-row-alt" : ""}`}
                    tabIndex={0}
                    onClick={(event) => handleTableRowClick(event, `/protocols/${row.protocol.id}`, navigate)}
                    onKeyDown={(event) => handleTableRowKeyDown(event, `/protocols/${row.protocol.id}`, navigate)}
                  >
                    <td>
                      <div className="entity-cell">
                        <EntityLogo
                          name={row.protocol.name}
                          website={row.protocolOverview?.website ?? row.protocol.website}
                          imageUrl={row.protocolOverview?.logoUrl ?? row.protocol.logoUrl}
                        />
                        <div className="asset-cell">
                          <Link className="table-link" to={`/protocols/${row.protocol.id}`}>
                            {row.protocol.name}
                          </Link>
                          <span className="table-subline">
                            {row.routes.length} tracked route{row.routes.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="mono-value value-risk">{row.safetyLabel}</td>
                    <td className="mono-value value-positive">{row.apyLabel}</td>
                    <td>
                      <div className="asset-cell">
                        {row.highestApyRoute ? (
                          getRouteSummaryUrl(row.highestApyRoute) ? (
                            <a
                              className="table-link"
                              href={getRouteSummaryUrl(row.highestApyRoute)!}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {row.highestApyRoute.opportunity.title}
                            </a>
                          ) : (
                            <span>{row.highestApyRoute.opportunity.title}</span>
                          )
                        ) : (
                          <span>No route</span>
                        )}
                        <span className="table-subline">
                          {row.highestApyRoute ? formatPercent(row.highestApyRoute.displayApy ?? row.highestApyRoute.grossApy) : "No APY data"}
                        </span>
                      </div>
                    </td>
                    <td className="mono-value">{row.chains.map((chainId) => formatChain(chainId)).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {realMarkets.length > 0 ? <LinkedMarketsPanel markets={realMarkets} /> : null}
    </main>
  );
}
