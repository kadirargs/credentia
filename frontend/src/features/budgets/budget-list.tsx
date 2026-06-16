"use client";

import { useCurrencyFormatter } from "@/components/theme/theme-provider";
import { formatMonthYear } from "@/lib/format";

import type { Budget } from "./types";

type BudgetListProps = {
  budgets: Budget[];
  onDelete?: (budget: Budget) => void;
  onEdit?: (budget: Budget) => void;
};

export function BudgetList({ budgets, onDelete, onEdit }: BudgetListProps) {
  const { formatCurrency } = useCurrencyFormatter();

  if (budgets.length === 0) {
    return <div className="empty-state">Henüz bütçe yok. İlk aylık bütçeni soldaki formdan ekleyebilirsin.</div>;
  }

  return (
    <div className="budget-list">
      {budgets.map((budget) => (
        <article className="budget-row" key={budget.id}>
          <div className="budget-row-header">
            <div>
              <strong>
                <span className="swatch" style={{ background: budget.category_color }} />
                {budget.category_name}
              </strong>
              <p className="muted">
                {formatMonthYear(budget.month, budget.year)}
              </p>
            </div>
            <strong>%{Math.round(budget.usage_percentage)}</strong>
          </div>

          <div className="progress-track" aria-label="Bütçe kullanım oranı">
            <span
              className={budget.usage_percentage > 100 ? "over-limit" : ""}
              style={{ width: `${Math.min(budget.usage_percentage, 100)}%` }}
            />
          </div>

          <div className="budget-values">
            <span>Ayrılan: {formatCurrency(budget.limit_amount)}</span>
            <span>Harcanan: {formatCurrency(budget.spent_amount)}</span>
            <span>Kalan: {formatCurrency(budget.remaining_amount)}</span>
          </div>

          {onEdit || onDelete ? (
            <div className="table-actions">
              {onEdit ? (
                <button className="small-button" type="button" onClick={() => onEdit(budget)}>
                  Düzenle
                </button>
              ) : null}
              {onDelete ? (
                <button className="small-button danger" type="button" onClick={() => onDelete(budget)}>
                  Sil
                </button>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
