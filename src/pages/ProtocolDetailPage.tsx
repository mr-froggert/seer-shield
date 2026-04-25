import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApyLabel } from "../components/ApyAdjustmentIndicator";
import { EntityLogo } from "../components/EntityLogo";
import { LinkedMarketsPanel } from "../components/LinkedMarketsPanel";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown";
import { ProtocolBadgeGroup } from "../components/ProtocolBadgeGroup";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { useTerminalData } from "../hooks/useTerminalData";
import { getProtocolDefiLlamaUrl } from "../lib/detailLinks";
import { formatChain, formatPercent, formatUsd } from "../lib/format";
import { getOpportunityUrl, getRouteSummaryUrl } from "../lib/opportunityLinks";
import { sortRouteSummaries } from "../lib/overview";
import { getAssetDetailHref } from "../lib/peggedAssets";
import { isPlatformSurfaceProtocol } from "../lib/platforms";
import { handleTableRowClick, handleTableRowKeyDown } from "../lib/tableRowNavigation";
import { getFilteredLinkedRoutes, getLinkedApyRangeForRoutes, getRouteDisplayApy } from "../lib/yieldRoutes";
import type { OpportunityRouteSummary, ProtocolOverviewViewModel } from "../lib/types";

interface ProtocolAssetRow {
  assetId: string;
  assetSymbol: string;
  assetName: string;
  assetHref: string | null;
  assetWebsite: string | null;
  assetLogoUrl: string | null;
  apyRangeLabel: string;
  topRoute: OpportunityRouteSummary | null;
}

type ProtocolAssetSortBy = "apy" | "symbol";

function formatApyRange(minApy: number | null, maxApy: number | null) {
  if (minApy == null || maxApy == null) {
    return "N/A";
  }

  if (Math.abs(minApy - maxApy) < 0.01) {
    return formatPercent(maxApy);
  }

  return `${formatPercent(minApy)} - ${formatPercent(maxApy)}`;
}

function buildAssetRows(routes: OpportunityRouteSummary[]) {
  const groupedRoutes = new Map<string, OpportunityRouteSummary[]>();

  for (const route of routes) {
    const assetRoutes = groupedRoutes.get(route.opportunity.asset.id);
    if (assetRoutes) {
      assetRoutes.push(route);
      continue;
    }

    groupedRoutes.set(route.opportunity.asset.id, [route]);
  }

  return [...groupedRoutes.entries()]
    .map<ProtocolAssetRow>(([assetId, routes]) => {
      routes.sort(sortRouteSummaries);
      const primaryRoute = routes[0]!;
      const topRoute =
        [...routes].sort(
          (left, right) =>
            (right.displayApy ?? right.grossApy ?? Number.NEGATIVE_INFINITY) -
            (left.displayApy ?? left.grossApy ?? Number.NEGATIVE_INFINITY)
        )[0] ?? primaryRoute;
      const assetHref = getAssetDetailHref(primaryRoute.opportunity.asset);
      const apyRange = getLinkedApyRangeForRoutes(routes);

      return {
        assetId,
        assetSymbol: primaryRoute.opportunity.asset.symbol,
        assetName: primaryRoute.opportunity.asset.name,
        assetHref: assetHref ?? getOpportunityUrl(primaryRoute.opportunity),
        assetWebsite: primaryRoute.opportunity.asset.website ?? primaryRoute.opportunity.protocol.website,
        assetLogoUrl: primaryRoute.opportunity.asset.logoUrl ?? primaryRoute.opportunity.protocol.logoUrl ?? null,
        apyRangeLabel: apyRange.label,
        topRoute
      };
    });
}

function sortAssetRows(rows: ProtocolAssetRow[], sortBy: ProtocolAssetSortBy) {
  return [...rows].sort((left, right) => {
    const leftMaxApy = left.topRoute ? getRouteDisplayApy(left.topRoute) ?? Number.NEGATIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const rightMaxApy = right.topRoute ? getRouteDisplayApy(right.topRoute) ?? Number.NEGATIVE_INFINITY : Number.NEGATIVE_INFINITY;

    if (sortBy === "apy" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    const symbolComparison = left.assetSymbol.localeCompare(right.assetSymbol);
    if (symbolComparison !== 0) {
      return symbolComparison;
    }

    if (sortBy === "symbol" && leftMaxApy !== rightMaxApy) {
      return rightMaxApy - leftMaxApy;
    }

    return left.assetName.localeCompare(right.assetName);
  });
}

function getRealMarkets(protocol: ProtocolOverviewViewModel["linkedMarkets"]) {
  return protocol.filter((market) => market.signal.marketSyncStatus === "created" && Boolean(market.signal.url));
}

export function ProtocolDetailPage() {
  const { riskAdjustedApy } = useAppPreferences();
  const { id } = useParams();
  const navigate = useNavigate();
  const { protocols } = useTerminalData();
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<ProtocolAssetSortBy>("apy");
  const protocol = protocols.find((entry) => entry.id === id && isPlatformSurfaceProtocol(entry));

  if (!protocol) {
    return (
      <main className="page-shell">
        <div className="callout error-callout">
          Platform not found. <Link to="/">Return to the platforms table.</Link>
        </div>
      </main>
    );
  }

  const availableChainIds = protocol.overviewChains;
  const filteredRoutes = useMemo(() => getFilteredLinkedRoutes(protocol, selectedChainIds), [protocol, selectedChainIds]);
  const assetRows = useMemo(() => sortAssetRows(buildAssetRows(filteredRoutes), sortBy), [filteredRoutes, sortBy]);
  const realMarkets = getRealMarkets(protocol.linkedMarkets);
  const protocolApyRange = getLinkedApyRangeForRoutes(filteredRoutes);
  const defillamaUrl = getProtocolDefiLlamaUrl(protocol);

  return (
    <main className="page-shell">
      <section className="surface-panel intro-panel">
        <div className="intro-copy">
          <div className="intro-heading">
            <EntityLogo name={protocol.name} website={protocol.website} imageUrl={protocol.logoUrl} size="lg" className="detail-logo" />
            <div className="intro-title-block">
              <p className="section-kicker">Platform</p>
              <h1 className="page-title">{protocol.name}</h1>
            </div>
          </div>
          <p className="hero-copy">{protocol.description}</p>
          <ProtocolBadgeGroup items={protocol.tags} className="detail-badge-row" />
          <div className="detail-actions">
            <a className="inline-link inline-link-strong" href={protocol.website} target="_blank" rel="noreferrer">
              Website
            </a>
            {defillamaUrl ? (
              <a className="inline-link inline-link-strong" href={defillamaUrl} target="_blank" rel="noreferrer">
                DefiLlama
              </a>
            ) : null}
          </div>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Platform safety</span>
            <strong className="mono-value value-risk">
              {protocol.riskProfile.coverage.priced === 0 ? "Unpriced" : formatPercent(protocol.riskProfile.expectedLossThroughExpiry)}
            </strong>
            <span className="table-subline">
              {protocol.riskProfile.coverage.priced === 0 ? "No priced platform risk market yet" : "Expected loss by current market horizon"}
            </span>
          </div>
          <div className="summary-card">
            <span><ApyLabel showAdjustment={riskAdjustedApy.enabled}>APY range</ApyLabel></span>
            <strong className="mono-value value-positive">
              {formatApyRange(protocolApyRange.min, protocolApyRange.max)}
            </strong>
            <span className="table-subline">
              {filteredRoutes.length === 0
                ? selectedChainIds.length === 0
                  ? "No tracked opportunity for this platform"
                  : "No tracked opportunity on the selected chains"
                : `Across ${assetRows.length} tracked asset${assetRows.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="summary-card">
            <span>Observed chains</span>
            <strong className="mono-value">{protocol.overviewChains.length}</strong>
            <span className="table-subline">
              {protocol.overviewChains.map((chainId) => formatChain(chainId)).join(", ")}
            </span>
          </div>
          <div className="summary-card">
            <span>Total TVL</span>
            <strong className="mono-value">{formatUsd(protocol.protocolMetrics?.totalTvlUsd)}</strong>
            <span className="table-subline">{assetRows.length} tracked asset{assetRows.length === 1 ? "" : "s"}</span>
          </div>
        </div>
      </section>
      <section className="surface-panel detail-support-panel detail-table-panel">
        <div className="card-header">
          <div>
            <p className="section-kicker">Tracked assets</p>
            <h3>Routes by asset</h3>
          </div>
          <div className="table-controls">
            <div className="field field-inline">
              <label className="control-label" htmlFor="platform-detail-sort">
                Sort by
              </label>
              <select
                id="platform-detail-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as ProtocolAssetSortBy)}
              >
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
        {assetRows.length === 0 ? (
          <div className="callout subtle-callout">
            {selectedChainIds.length === 0
              ? "No linked asset routes are configured for this platform yet."
              : "No linked asset routes are available on the selected chains."}
          </div>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>APY</ApyLabel></th>
                  <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY route</ApyLabel></th>
                </tr>
              </thead>
              <tbody>
                {assetRows.map((row, index) => (
                  <tr
                    key={row.assetId}
                    className={`table-row-clickable${index % 2 === 1 ? " table-row-alt" : ""}`}
                    tabIndex={row.assetHref ? 0 : -1}
                    onClick={(event) => handleTableRowClick(event, row.assetHref, navigate)}
                    onKeyDown={(event) => handleTableRowKeyDown(event, row.assetHref, navigate)}
                  >
                    <td>
                      <div className="entity-cell">
                        <EntityLogo name={row.assetName} website={row.assetWebsite} imageUrl={row.assetLogoUrl} />
                        <div className="asset-cell">
                          {row.assetHref ? (
                            row.assetHref.startsWith("/") ? (
                              <Link className="table-link mono-value" to={row.assetHref}>
                                {row.assetSymbol}
                              </Link>
                            ) : (
                              <a className="table-link mono-value" href={row.assetHref} target="_blank" rel="noreferrer">
                                {row.assetSymbol}
                              </a>
                            )
                          ) : (
                            <span className="mono-value">{row.assetSymbol}</span>
                          )}
                          <span className="table-subline">{row.assetName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="mono-value value-positive">{row.apyRangeLabel}</td>
                    <td>
                      {row.topRoute ? (
                        <div className="asset-cell">
                          {getRouteSummaryUrl(row.topRoute) ? (
                            <a
                              className="table-link"
                              href={getRouteSummaryUrl(row.topRoute)!}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {row.topRoute.opportunity.title}
                            </a>
                          ) : (
                            <span>{row.topRoute.opportunity.title}</span>
                          )}
                          <span className="table-subline">Highest visible APY for this asset on {protocol.name}</span>
                        </div>
                      ) : (
                        <span className="table-subline">No route tracked</span>
                      )}
                    </td>
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
