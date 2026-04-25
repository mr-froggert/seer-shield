import type { ReactNode } from "react";
import { RISK_ADJUSTED_APY_INDICATOR_TOOLTIP } from "../lib/appPreferences";
import { InlineTooltip } from "./InlineTooltip";

interface ApyAdjustmentIndicatorProps {
  show: boolean;
}

export function ApyAdjustmentIndicator({ show }: ApyAdjustmentIndicatorProps) {
  if (!show) {
    return null;
  }

  return (
    <InlineTooltip
      className="apy-adjustment-tooltip"
      label="Risk-adjusted APY active"
      content={RISK_ADJUSTED_APY_INDICATOR_TOOLTIP}
    >
      <span className="apy-adjustment-indicator" aria-hidden="true" />
    </InlineTooltip>
  );
}

interface ApyLabelProps {
  children: ReactNode;
  showAdjustment: boolean;
}

export function ApyLabel({ children, showAdjustment }: ApyLabelProps) {
  return (
    <span className="apy-label">
      <span>{children}</span>
      <ApyAdjustmentIndicator show={showAdjustment} />
    </span>
  );
}
