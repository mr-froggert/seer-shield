import { useEffect, useState } from "react";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { RISK_ADJUSTED_APY_SETTINGS_TOOLTIP } from "../lib/appPreferences";
import { InlineTooltip } from "./InlineTooltip";

interface RiskAdjustedApySettingsPanelProps {
  compact?: boolean;
}

function parsePercentInput(value: string) {
  const digits = value.replace(/[^\d.]/g, "");

  if (digits.length === 0) {
    return 0;
  }

  const parsedValue = Number(digits);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, parsedValue));
}

function formatPercentInput(value: number) {
  return `${value}%`;
}

function sanitizePercentDraft(value: string) {
  const digits = value.replace(/[^\d.]/g, "");

  if (digits.length === 0) {
    return "";
  }

  const decimalParts = digits.split(".");
  const normalizedValue =
    decimalParts.length === 1 ? decimalParts[0] : `${decimalParts[0]}.${decimalParts.slice(1).join("")}`;
  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    return "";
  }

  return String(Math.min(100, Math.max(0, parsedValue)));
}

interface PercentInputFieldProps {
  ariaLabel: string;
  label: string;
  value: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}

function PercentInputField({ ariaLabel, label, value, disabled, onCommit }: PercentInputFieldProps) {
  const [draftValue, setDraftValue] = useState(() => String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraftValue(String(value));
    }
  }, [isFocused, value]);

  return (
    <label className="field">
      <span className="control-label">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={isFocused ? draftValue : formatPercentInput(value)}
        disabled={disabled}
        onFocus={() => {
          setIsFocused(true);
          setDraftValue(String(value));
        }}
        onBlur={() => {
          const nextValue = parsePercentInput(draftValue);
          setIsFocused(false);
          setDraftValue(String(nextValue));
          onCommit(nextValue);
        }}
        onChange={(event) => {
          const nextDraftValue = sanitizePercentDraft(event.target.value);
          setDraftValue(nextDraftValue);
          onCommit(parsePercentInput(nextDraftValue));
        }}
      />
    </label>
  );
}

export function RiskAdjustedApySettingsPanel({ compact = false }: RiskAdjustedApySettingsPanelProps) {
  const { riskAdjustedApy, updateRiskAdjustedApy } = useAppPreferences();

  return (
    <section className={`preference-panel${compact ? " preference-panel-compact" : ""}`} aria-label="Risk-adjusted APY settings">
      <div className="preference-panel-header">
        <div>
          <p className="section-kicker">Preferences</p>
          <h2 className="preference-panel-title">Risk-adjusted APY</h2>
        </div>
        <InlineTooltip
          className="preference-panel-tooltip"
          label="About risk-adjusted APY"
          content={RISK_ADJUSTED_APY_SETTINGS_TOOLTIP}
        >
          <span className="info-indicator" aria-hidden="true">
            i
          </span>
        </InlineTooltip>
      </div>
      <label className="toggle-row">
        <span>Enable global APY adjustment</span>
        <input
          type="checkbox"
          checked={riskAdjustedApy.enabled}
          onChange={(event) => updateRiskAdjustedApy({ enabled: event.target.checked })}
        />
      </label>
      <div className="preference-field-grid">
        <PercentInputField
          ariaLabel="Asset depeg recoverable %"
          label="Asset depeg recoverable %"
          value={riskAdjustedApy.assetDepegRecoverablePercent}
          disabled={!riskAdjustedApy.enabled}
          onCommit={(assetDepegRecoverablePercent) => updateRiskAdjustedApy({ assetDepegRecoverablePercent })}
        />
        <PercentInputField
          ariaLabel="Platform exploit recoverable %"
          label="Platform exploit recoverable %"
          value={riskAdjustedApy.platformExploitRecoverablePercent}
          disabled={!riskAdjustedApy.enabled}
          onCommit={(platformExploitRecoverablePercent) => updateRiskAdjustedApy({ platformExploitRecoverablePercent })}
        />
      </div>
    </section>
  );
}
