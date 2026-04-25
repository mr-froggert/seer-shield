import { useNavigate } from "react-router-dom";
import { formatProbability, formatUsd } from "../lib/format";
import { handleTableRowClick, handleTableRowKeyDown } from "../lib/tableRowNavigation";
import type { LinkedMarketView } from "../lib/types";

interface LinkedMarketsPanelProps {
  markets: LinkedMarketView[];
}

export function LinkedMarketsPanel({ markets }: LinkedMarketsPanelProps) {
  const navigate = useNavigate();

  return (
    <section className="surface-panel detail-support-panel compact-market-panel">
      <div className="card-header">
        <div>
          <p className="section-kicker">Markets</p>
          <h3>Linked markets</h3>
        </div>
      </div>
      {markets.length === 0 ? (
        <div className="callout subtle-callout">No linked Seer markets are configured for this scope yet.</div>
      ) : (
        <div className="table-shell compact-market-table-shell">
          <table className="data-table compact-market-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Probability</th>
                <th>Liquidity</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {markets.map((market, index) => (
                <tr
                  key={`${market.marketGroupId}-${market.signal.label}`}
                  className={`${market.signal.url ? "table-row-clickable" : ""}${index % 2 === 1 ? " table-row-alt" : ""}`}
                  tabIndex={market.signal.url ? 0 : -1}
                  onClick={(event) => handleTableRowClick(event, market.signal.url, navigate)}
                  onKeyDown={(event) => handleTableRowKeyDown(event, market.signal.url, navigate)}
                >
                  <td>
                    <div className="asset-cell">
                      <strong>{market.signal.marketName}</strong>
                      <span className="table-subline">{market.subjectLabel}</span>
                    </div>
                  </td>
                  <td className="mono-value value-risk">{formatProbability(market.signal.probability)}</td>
                  <td className="mono-value">{formatUsd(market.signal.liquidityUsd, false)}</td>
                  <td className="compact-market-action">
                    {market.signal.url ? (
                      <a className="secondary-button compact-action-button" href={market.signal.url} target="_blank" rel="noreferrer">
                        Trade on Seer
                      </a>
                    ) : (
                      <span className="chip">Not live</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
