export type CrisisScenarioId = "pandemic_2020" | "crypto_2022";
export type CrisisCoin = "BTC" | "ETH" | "BNB" | "SOL" | "XRP" | "ADA" | "DOGE" | "AVAX" | "LINK" | "TRX";

export type CrisisMonthlyPoint = {
  month: string;
  price: number;
  estimatedValue: number;
};

export type CrisisScenarioResult = {
  scenario: CrisisScenarioId;
  scenarioName: string;
  coin: CrisisCoin;
  amount: number;
  startDate: string;
  endDate: string;
  startPrice: number | null;
  endPrice: number | null;
  finalValue: number | null;
  profitLoss: number | null;
  profitLossPercent: number | null;
  monthlyPrices: CrisisMonthlyPoint[];
  hasEnoughData: boolean;
  isEstimated: boolean;
  message: string | null;
  disclaimer: string;
};
