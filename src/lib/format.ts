import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { CHAIN_LABELS } from "./constants";

export function formatPercent(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${value.toFixed(digits)}%`;
}

export function formatProbability(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "Unpriced";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function formatUsd(value: number | null | undefined, compact = true) {
  if (value == null || !Number.isFinite(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 0
  }).format(value);
}

export function formatDate(value: string) {
  return format(parseISO(value), "MMM d, yyyy");
}

export function formatDateTime(value: string) {
  return format(parseISO(value), "MMM d, yyyy HH:mm 'UTC'");
}

export function formatRelativeHorizon(value: string) {
  return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
}

export function formatChain(chainId: number) {
  return CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;
}

export function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}
