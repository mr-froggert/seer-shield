import { Link, useNavigate } from "react-router-dom";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { formatChain, formatPercent, formatProbability } from "../lib/format";
import { getRouteSummaryUrl } from "../lib/opportunityLinks";
import { getFilteredLinkedRoutes, getHighestLinkedApyRoute, getLinkedApyRange } from "../lib/yieldRoutes";
import {
  getPeggedAssetDetailHref,
  getPrimaryPeggedAssetSignal
} from "../lib/peggedAssets";
import { handleTableRowClick, handleTableRowKeyDown } from "../lib/tableRowNavigation";
import { ApyLabel } from "./ApyAdjustmentIndicator";
import { EntityLogo } from "./EntityLogo";
import type { PeggedAssetOverviewViewModel } from "../lib/types";

interface PeggedAssetTableProps {
  assets: PeggedAssetOverviewViewModel[];
  assetLabel: string;
  showSupportedChains?: boolean;
  selectedChainIds?: number[];
}

function renderLinkedApyRange(asset: PeggedAssetOverviewViewModel, selectedChainIds: number[]) {
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

function renderHighestApyRoute(asset: PeggedAssetOverviewViewModel, selectedChainIds: number[]) {
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

export function PeggedAssetTable({
  assets,
  assetLabel,
  showSupportedChains = false,
  selectedChainIds = []
}: PeggedAssetTableProps) {
  const { riskAdjustedApy } = useAppPreferences();
  const navigate = useNavigate();

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>{assetLabel}</th>
            <th>Depeg Risk</th>
            {showSupportedChains ? <th>Supported chains</th> : null}
            <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>APY range</ApyLabel></th>
            <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>Highest APY route</ApyLabel></th>
            <th>Issuer</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => {
            const detailHref = getPeggedAssetDetailHref(asset);
            const primarySignal = getPrimaryPeggedAssetSignal(asset);

            return (
              <tr
                key={asset.id}
                className={`table-row-clickable${index % 2 === 1 ? " table-row-alt" : ""}`}
                tabIndex={detailHref ? 0 : -1}
                onClick={(event) => handleTableRowClick(event, detailHref, navigate)}
                onKeyDown={(event) => handleTableRowKeyDown(event, detailHref, navigate)}
              >
                <td>
                  <div className="entity-cell">
                    <EntityLogo
                      name={asset.name}
                      website={asset.website ?? asset.issuerProtocol.website}
                      imageUrl={asset.logoUrl ?? asset.issuerProtocol.logoUrl}
                    />
                    <div className="asset-cell">
                      {detailHref ? (
                        <Link className="table-link mono-value" to={detailHref}>
                          {asset.symbol}
                        </Link>
                      ) : (
                        <span className="mono-value">{asset.symbol}</span>
                      )}
                      <span className="table-subline">{asset.name}</span>
                    </div>
                  </div>
                </td>
                <td className="mono-value value-risk">{formatProbability(primarySignal?.probability)}</td>
                {showSupportedChains ? (
                  <td>
                    <div className="asset-cell">
                      <span>{asset.chains.length} chain{asset.chains.length === 1 ? "" : "s"}</span>
                      <span className="table-subline">{asset.chains.map((chainId) => formatChain(chainId)).join(", ")}</span>
                    </div>
                  </td>
                ) : null}
                <td>{renderLinkedApyRange(asset, selectedChainIds)}</td>
                <td>{renderHighestApyRoute(asset, selectedChainIds)}</td>
                <td>
                  <a className="inline-link inline-link-strong" href={asset.issuerProtocol.website} target="_blank" rel="noreferrer">
                    {asset.issuerProtocol.name}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
