import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import {
  DEFAULT_RISK_ADJUSTED_APY_PREFERENCES,
  getAdjustedYieldSettings,
  readRiskAdjustedApyPreferences,
  writeRiskAdjustedApyPreferences
} from "../lib/appPreferences";
import type { RiskAdjustedApyPreferences } from "../lib/types";

interface AppPreferencesContextValue {
  riskAdjustedApy: RiskAdjustedApyPreferences;
  adjustedYieldSettings: ReturnType<typeof getAdjustedYieldSettings>;
  setRiskAdjustedApy: (value: RiskAdjustedApyPreferences) => void;
  updateRiskAdjustedApy: (value: Partial<RiskAdjustedApyPreferences>) => void;
}

const defaultContextValue: AppPreferencesContextValue = {
  riskAdjustedApy: DEFAULT_RISK_ADJUSTED_APY_PREFERENCES,
  adjustedYieldSettings: getAdjustedYieldSettings(DEFAULT_RISK_ADJUSTED_APY_PREFERENCES),
  setRiskAdjustedApy: () => {},
  updateRiskAdjustedApy: () => {}
};

const AppPreferencesContext = createContext<AppPreferencesContextValue>(defaultContextValue);

function resolveInitialRiskAdjustedApyPreferences() {
  if (typeof window === "undefined") {
    return DEFAULT_RISK_ADJUSTED_APY_PREFERENCES;
  }

  return readRiskAdjustedApyPreferences(window.localStorage);
}

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const [riskAdjustedApy, setRiskAdjustedApy] = useState<RiskAdjustedApyPreferences>(
    resolveInitialRiskAdjustedApyPreferences
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      writeRiskAdjustedApyPreferences(window.localStorage, riskAdjustedApy);
    }
  }, [riskAdjustedApy]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      riskAdjustedApy,
      adjustedYieldSettings: getAdjustedYieldSettings(riskAdjustedApy),
      setRiskAdjustedApy,
      updateRiskAdjustedApy: (nextValue) =>
        setRiskAdjustedApy((currentValue) => ({
          ...currentValue,
          ...nextValue
        }))
    }),
    [riskAdjustedApy]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  return useContext(AppPreferencesContext);
}
