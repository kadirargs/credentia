import type { RiskLevel, SimulationPeriod } from "@/features/investment-simulation/types";

export type AiRivalPortfolioItem = {
  symbol: string;
  name: string;
  weight: number;
  startPrice: number;
  currentPrice: number;
  startValue: number;
  currentValue: number;
  profitLossPercent: number;
};

export type AiRivalPerformancePoint = {
  label: string;
  value: number;
};

export type AiRivalResult = {
  id: string;
  name: string;
  type: "user" | "strategy";
  description: string;
  riskLevel: string;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  rank: number;
  portfolioSummary: string;
  portfolio: AiRivalPortfolioItem[];
  performancePoints: AiRivalPerformancePoint[];
};

export type AiRivalWinner = {
  id: string;
  name: string;
  riskLevel: string;
  currentValue: number;
  profitLossPercent: number;
};

export type AiRivalsSimulationResult = {
  amount: number;
  risk: RiskLevel;
  period: SimulationPeriod;
  initialDateLabel: string;
  results: AiRivalResult[];
  winner: AiRivalWinner;
  userRank: number;
  reasonText: string;
  lessonText: string;
  disclaimer: string;
};
