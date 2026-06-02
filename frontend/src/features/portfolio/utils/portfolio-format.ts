import { fmtNumber, fmtPct, fmtUsd, shortAddress } from "@/lib/format";
import type { PortfolioActivityType, PortfolioPositionStatus } from "../types";

export function formatPortfolioAddress(address?: string, chars = 4) {
  return shortAddress(address, chars) || "0x0000…0000";
}

export function formatPortfolioHash(hash: string, chars = 6) {
  return shortAddress(hash, chars);
}

export function formatPortfolioUsd(value: number, compact = false) {
  return fmtUsd(value, { compact });
}

export function formatPortfolioNumber(value: number, compact = false, max = 2) {
  return fmtNumber(value, { compact, max });
}

export function formatPortfolioPct(value: number, max = 2) {
  return fmtPct(value, max);
}

export function formatPortfolioTime(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function titleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function activityLabel(type: PortfolioActivityType) {
  return titleCase(type);
}

export function positionStatusTone(status: PortfolioPositionStatus) {
  return status === "In Range"
    ? "bg-success/15 text-success border-success/20"
    : "bg-warning/15 text-warning border-warning/20";
}

export function activityStatusTone(status: "confirmed" | "pending" | "failed") {
  if (status === "confirmed") return "bg-success/15 text-success border-success/20";
  if (status === "pending") return "bg-warning/15 text-warning border-warning/20";
  return "bg-destructive/15 text-destructive border-destructive/20";
}
