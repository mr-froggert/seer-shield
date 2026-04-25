import { Link, useNavigate } from "react-router-dom";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { formatChain, formatPercent, formatUsd } from "../lib/format";
import { handleTableRowClick, handleTableRowKeyDown } from "../lib/tableRowNavigation";
import { getProtocolLinkedApyRange } from "../lib/yieldRoutes";
import { ApyLabel } from "./ApyAdjustmentIndicator";
import { EntityLogo } from "./EntityLogo";
import type { ProtocolOverviewViewModel } from "../lib/types";

export interface ProtocolRow {
  protocol: ProtocolOverviewViewModel;
}

interface ProtocolTableProps {
  rows: ProtocolRow[];
}

function formatApyRange(minApy: number | null, maxApy: number | null) {
  if (minApy == null || maxApy == null) {
    return "N/A";
  }

  if (Math.abs(minApy - maxApy) < 0.01) {
    return formatPercent(maxApy);
  }

  return `${formatPercent(minApy)} - ${formatPercent(maxApy)}`;
}

function getProtocolApyRange(protocol: ProtocolOverviewViewModel, showAdjusted: boolean) {
  const apyRange = getProtocolLinkedApyRange(protocol, showAdjusted);
  return formatApyRange(apyRange.min, apyRange.max);
}

function formatRiskFactor(protocol: ProtocolOverviewViewModel) {
  if (protocol.riskProfile.coverage.priced === 0 || protocol.riskProfile.expectedLossThroughExpiry == null) {
    return "Unpriced";
  }

  return formatPercent(protocol.riskProfile.expectedLossThroughExpiry);
}

export function ProtocolTable({ rows }: ProtocolTableProps) {
  const { riskAdjustedApy } = useAppPreferences();
  const navigate = useNavigate();

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Protocol</th>
            <th>Exploit Risk</th>
            <th>Supported chains</th>
            <th><ApyLabel showAdjustment={riskAdjustedApy.enabled}>APY range</ApyLabel></th>
            <th>Total TVL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ protocol }, index) => (
            <tr
              key={protocol.id}
              className={`table-row-clickable${index % 2 === 1 ? " table-row-alt" : ""}`}
              tabIndex={0}
              onClick={(event) => handleTableRowClick(event, `/protocols/${protocol.id}`, navigate)}
              onKeyDown={(event) => handleTableRowKeyDown(event, `/protocols/${protocol.id}`, navigate)}
            >
              <td>
                <div className="entity-cell">
                  <EntityLogo name={protocol.name} website={protocol.website} />
                  <div>
                    <Link className="table-link" to={`/protocols/${protocol.id}`}>
                      {protocol.name}
                    </Link>
                    <div className="table-subline">{protocol.category}</div>
                  </div>
                </div>
              </td>
              <td className="mono-value value-risk">{formatRiskFactor(protocol)}</td>
              <td>
                <div className="asset-cell">
                  <span>{protocol.chains.length} chain{protocol.chains.length === 1 ? "" : "s"}</span>
                  <span className="table-subline">{protocol.chains.map((chainId) => formatChain(chainId)).join(", ")}</span>
                </div>
              </td>
              <td className="mono-value value-positive">
                {getProtocolApyRange(protocol, riskAdjustedApy.enabled)}
              </td>
              <td className="mono-value">{formatUsd(protocol.protocolMetrics?.totalTvlUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
