export type RiskLevel = "low" | "medium" | "high";
export type SimulationPeriod = "short" | "medium" | "long";

export type PortfolioItem = {
  symbol: string;
  name: string;
  weight: number;
  startPrice: number;
  currentPrice: number;
  startValue: number;
  currentValue: number;
  profitLossPercent: number;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type InvestmentSimulationResult = {
  amount: number;
  risk: RiskLevel;
  period: SimulationPeriod;
  initialDateLabel: string;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  portfolio: PortfolioItem[];
  chartData: ChartPoint[];
  disclaimer: string;
};
