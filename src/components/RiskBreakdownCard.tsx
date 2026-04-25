import { formatDate, formatPercent, formatProbability, formatUsd, sentenceCase } from "../lib/format";
import type { RiskProfile } from "../lib/types";

interface RiskBreakdownCardProps {
  riskProfile: RiskProfile;
}

function getSignalStateLabel(riskProfileSignal: RiskProfile["signals"][number]) {
  if (riskProfileSignal.marketSyncStatus === "missing") {
    return "market missing";
  }

  if (riskProfileSignal.marketSyncStatus === "pending") {
    return "market pending";
  }

  return riskProfileSignal.probabilitySource === "seer" ? "market derived" : "unpriced";
}

export function RiskBreakdownCard({ riskProfile }: RiskBreakdownCardProps) {
  return (
    <section className="risk-panel">
      <div className="card-header">
        <div>
          <p className="section-kicker risk-kicker">Risk summary</p>
          <h3>Market-implied downside</h3>
        </div>
      </div>
      <div className="risk-panel-summary">
        <div>
          <span className="risk-panel-label">Expected loss by horizon</span>
          <strong className="risk-panel-value">
            {riskProfile.coverage.priced === 0 || riskProfile.expectedLossThroughExpiry == null
              ? "Unpriced"
              : formatPercent(riskProfile.expectedLossThroughExpiry)}
          </strong>
        </div>
      </div>
      {riskProfile.signals.length === 0 ? (
        <div className="callout subtle-callout">No linked markets are configured for this scope yet.</div>
      ) : (
        <div className="signal-stack risk-breakdown-stack">
          {riskProfile.signals.map((signal) => (
            <div key={signal.label} className="risk-breakdown-row">
              <div>
                <span className="risk-breakdown-label">{signal.label}</span>
                <p>{sentenceCase(signal.kind)} • {getSignalStateLabel(signal)}</p>
              </div>
              <div className="risk-breakdown-values mono-value">
                <span>{formatProbability(signal.probability)}</span>
                <span>{signal.expectedLoss == null ? "Unpriced" : formatPercent(signal.expectedLoss)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <dl className="detail-list risk-meta-list">
        <div>
          <dt>Horizon end</dt>
          <dd>{riskProfile.horizonEnd == null ? "Unspecified" : formatDate(riskProfile.horizonEnd)}</dd>
        </div>
        <div>
          <dt>Priced signals</dt>
          <dd>{riskProfile.coverage.priced}</dd>
        </div>
        <div>
          <dt>Unpriced signals</dt>
          <dd>{riskProfile.coverage.unpriced}</dd>
        </div>
        <div>
          <dt>Total market liquidity</dt>
          <dd className="mono-value">{formatUsd(riskProfile.coverage.totalLiquidityUsd, false)}</dd>
        </div>
      </dl>
      {riskProfile.notes.length > 0 ? (
        <div className="risk-panel-note">
          {riskProfile.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
