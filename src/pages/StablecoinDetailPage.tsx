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
import type { StablecoinOverviewViewModel } from "../lib/types";

function getRealMarkets(stablecoin: StablecoinOverviewViewModel["linkedMarkets"]) {
  return stablecoin.filter((market) => market.signal.marketSyncStatus === "created" && Boolean(market.signal.url));
}

export function StablecoinDetailPage() {
  const { riskAdjustedApy } = useAppPreferences();
  const { id } = useParams();
  const navigate = useNavigate();
  const { protocols, stablecoins } = useTerminalData();
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<YieldAssetProtocolSortBy>("safety");
  const stablecoin = stablecoins.find((entry) => entry.id === id);

  if (!stablecoin) {
    return (
      <main className="page-shell">
        <div className="callout error-callout">
          Stablecoin not found. <Link to="/stablecoins">Return to the stablecoins table.</Link>
        </div>
      </main>
    );
  }

  const depegSignal = getPrimaryPeggedAssetSignal(stablecoin);
  const availableChainIds = stablecoin.overviewChains;
  const protocolMap = useMemo(() => new Map(protocols.map((protocol) => [protocol.id, protocol])), [protocols]);
  const filteredRoutes = useMemo(
    () => getFilteredLinkedRoutes(stablecoin, selectedChainIds),
    [selectedChainIds, stablecoin]
  );
  const routeRows = useMemo(() => [...filteredRoutes].sort(sortRoutesByApyThenTitle), [filteredRoutes]);
  const protocolRows = useMemo(
    () => sortYieldAssetProtocolRows(buildYieldAssetProtocolRows(routeRows, protocolMap), sortBy),
    [protocolMap, routeRows, sortBy]
  );
  const apyRange = getLinkedApyRange(stablecoin, selectedChainIds);
  const topYieldRoute = getHighestLinkedApyRoute(stablecoin, selectedChainIds);
  const topYieldRouteUrl = getRouteSummaryUrl(topYieldRoute);
  const defillamaUrl = getAssetDefiLlamaUrl(stablecoin);
  const coinGeckoUrl = getCoinGeckoAssetUrl(stablecoin);
  const realMarkets = getRealMarkets(stablecoin.linkedMarkets);

  return (
    <main className="page-shell">
      <section className="surface-panel intro-panel">
        <div className="intro-copy">
          <div className="intro-heading">
            <EntityLogo
              name={stablecoin.symbol}
              website={stablecoin.website ?? stablecoin.issuerProtocol.website}
              imageUrl={stablecoin.logoUrl ?? stablecoin.issuerProtocol.logoUrl}
              size="lg"
              className="detail-logo"
            />
            <div className="intro-title-block">
              <p className="section-kicker">Stablecoin</p>
              <h1 className="page-title">{stablecoin.symbol}</h1>
            </div>
          </div>
          <p className="hero-copy">
            {stablecoin.description ?? `${stablecoin.name} is tracked as a dollar asset with explicit issuer and depeg context.`}
          </p>
          <ProtocolBadgeGroup items={stablecoin.tags} className="detail-badge-row" />
          <div className="detail-actions">
            <a
              className="inline-link inline-link-strong"
              href={stablecoin.website ?? stablecoin.issuerProtocol.website}
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
            <strong className="mono-value value-risk">{formatProbability(depegSignal?.probability)}</strong>
            <span className="table-subline">
              {depegSignal == null
                ? "No depeg market configured"
                : `${depegSignal.label}${depegSignal.horizonEnd ? ` by ${formatDate(depegSignal.horizonEnd)}` : ""}`}
            </span>
            {depegSignal?.url ? (
              <a className="secondary-button compact-action-button" href={depegSignal.url} target="_blank" rel="noreferrer">
                Trade on Seer
              </a>
            ) : null}
          </div>
          <div className="summary-card">
            <span><ApyLabel showAdjustment={riskAdjustedApy.enabled}>APY range</ApyLabel></span>
            <strong className="mono-value value-positive">{apyRange.label}</strong>
            <span className="table-subline">
              {routeRows.length === 0
                ? selectedChainIds.length === 0
                  ? "No tracked APY yet"
                  : "No tracked APY on selected chains"
                : `Across ${routeRows.length} tracked route${routeRows.length === 1 ? "" : "s"}`}
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
              <span className="table-subline">No tracked opportunity for this stablecoin</span>
            )}
          </div>
          <div className="summary-card">
            <span>Observed chains</span>
            <strong className="mono-value">{stablecoin.overviewChains.length}</strong>
            <span className="table-subline">{stablecoin.overviewChains.map((chainId) => formatChain(chainId)).join(", ")}</span>
          </div>
        </div>
      </section>

      <section className="surface-panel detail-support-panel detail-table-panel">
        <div className="card-header">
          <div>
            <p className="section-kicker">Tracked venues</p>
            <h3>Routes for {stablecoin.symbol}</h3>
          </div>
          <div className="table-controls">
            <div className="field field-inline">
              <label className="control-label" htmlFor="stablecoin-detail-sort">
                Sort by
              </label>
              <select
                id="stablecoin-detail-sort"
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
              ? "No tracked yield route is configured for this stablecoin yet."
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
