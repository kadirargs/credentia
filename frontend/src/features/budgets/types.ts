export type Budget = {
  id: number;
  category_id: number;
  category_name: string;
  category_color: string;
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  usage_percentage: number;
  month: number;
  year: number;
};

export type BudgetSummary = {
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  usage_percentage: number;
  month: number;
  year: number;
};

