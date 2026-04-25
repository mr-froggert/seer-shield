import { Link, useNavigate } from "react-router-dom";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { formatChain, formatPercent } from "../lib/format";
import { getRouteSummaryUrl } from "../lib/opportunityLinks";
import { handleTableRowClick, handleTableRowKeyDown } from "../lib/tableRowNavigation";
import { getFilteredLinkedRoutes, getHighestLinkedApyRoute, getLinkedApyRange } from "../lib/yieldRoutes";
import { ApyLabel } from "./ApyAdjustmentIndicator";
import { EntityLogo } from "./EntityLogo";
import type { CoreAssetOverviewViewModel } from "../lib/types";

interface CoreAssetTableProps {
  assets: CoreAssetOverviewViewModel[];
  selectedChainIds?: number[];
}

function renderApyRange(asset: CoreAssetOverviewViewModel, selectedChainIds: number[]) {
  const filteredRoutes = getFilteredLinkedRoutes(asset, selectedChainIds);
  const apyRange = getLinkedApyRange(asset, selectedChainIds);

  if (apyRange.min == null || apyRange.max == null) {
    return (
      <span className="table-subline">
        {selectedChainIds.length === 0 ? "No linked APY tracked yet" : "No linked APY on selected chains"}
      </span>
    );
  }

  return (
    <div className="asset-cell">
      <span className="mono-value value-positive">{apyRange.label}</span>
      <span className="table-subline">
        Across {filteredRoutes.length} tracked route{filteredRoutes.length === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function renderHighestApyRoute(asset: CoreAssetOverviewViewModel, selectedChainIds: number[]) {
  const topRoute = getHighestLinkedApyRoute(asset, selectedChainIds);
  const routeUrl = getRouteSummaryUrl(topRoute);

  if (!topRoute) {
    return (
      <div className="asset-cell">
        <span className="mono-value">No route</span>
        <span className="table-subline">
          {selectedChainIds.length === 0 ? "No tracked opportunity yet" : "No tracked opportunity on selected chains"}
        </span>
      </div>
    );
  }

  return (
    <div className="asset-cell">
      {routeUrl ? (
        <a className="table-link" href={routeUrl} target="_blank" rel="noreferrer">
          {topRoute.opportunity.title}
        </a>
      ) : (
        <span>{topRoute.opportunity.title}</span>
      )}
      <span className="table-subline">{formatPercent(topRoute.displayApy ?? topRoute.grossApy)} APY</span>
    </div>
  );
}

function renderRelevantProtocols(asset: CoreAssetOverviewViewModel, selectedChainIds: number[]) {
  const groupedProtocols = new Map<
    string,
    {
      id: string;
      name: string;
    }
  >();

  for (const route of getFilteredLinkedRoutes(asset, selectedChainIds)) {
    const protocolId = route.opportunity.protocol.id;
    const current = groupedProtocols.get(protocolId);

    if (current) {
      continue;
    }

    groupedProtocols.set(protocolId, {
      id: protocolId,
      name: route.opportunity.protocol.name
    });
  }

  const protocols = [...groupedProtocols.values()].sort((left, right) => left.name.localeCompare(right.name));

  if (protocols.length === 0) {
    return (
      <div className="asset-cell">
        <span className="mono-value">No linked venues</span>
        <span className="table-subline">
          {selectedChainIds.length === 0 ? "No tracked protocol routes yet" : "No tracked protocol routes on selected chains"}
        </span>
      </div>
    );
  }

  return (
    <div className="asset-cell">
      <div>
        {protocols.map((protocol, index) => (
          <span key={protocol.id}>
            {index > 0 ? ", " : null}
            <Link className="inline-link inline-link-strong" to={`/protocols/${protocol.id}`}>
              {protocol.name}
            </Link>
          </span>
        ))}
      </div>
      <span className="table-subline">Tracked yield venues for this asset</span>
    </div>
  );
}

export function CoreAssetTable({ assets, selectedChainIds = [] }: CoreAssetTableProps) {
  const { riskAdjustedApy } = useAppPreferences();
  const navigate = useNavigate();

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Observed chains</th>
            <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>APY range</ApyLabel></th>
            <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY route</ApyLabel></th>
            <th>Platforms</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => (
            <tr
              key={asset.id}
              className={`table-row-clickable${index % 2 === 1 ? " table-row-alt" : ""}`}
              tabIndex={0}
              onClick={(event) => handleTableRowClick(event, `/core-assets/${asset.id}`, navigate)}
              onKeyDown={(event) => handleTableRowKeyDown(event, `/core-assets/${asset.id}`, navigate)}
            >
              <td>
                <div className="entity-cell">
                  <EntityLogo
                    name={asset.name}
                    website={asset.website ?? asset.protocol.website}
                    imageUrl={asset.logoUrl ?? asset.protocol.logoUrl}
                  />
                  <div className="asset-cell">
                    <Link className="table-link mono-value" to={`/core-assets/${asset.id}`}>
                      {asset.symbol}
                    </Link>
                    <span className="table-subline">{asset.name}</span>
                  </div>
                </div>
              </td>
              <td>
                <div className="asset-cell">
                  <span>{asset.overviewChains.length} chain{asset.overviewChains.length === 1 ? "" : "s"}</span>
                  <span className="table-subline">{asset.overviewChains.map((chainId) => formatChain(chainId)).join(", ")}</span>
                </div>
              </td>
              <td>{renderApyRange(asset, selectedChainIds)}</td>
              <td>{renderHighestApyRoute(asset, selectedChainIds)}</td>
              <td>{renderRelevantProtocols(asset, selectedChainIds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
