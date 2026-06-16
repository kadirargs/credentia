"use client";

import type { Category } from "@/features/categories/types";
import { useCurrencyFormatter, useLanguage } from "@/components/theme/theme-provider";
import { formatDate } from "@/lib/format";

export type Transaction = {
  id: number;
  type: "income" | "expense";
  amount: number;
  occurred_on: string;
  category_id: number | null;
  description: string;
};

type TransactionTableProps = {
  categories?: Category[];
  emptyMessage?: string;
  selectedIds?: number[];
  transactions: Transaction[];
  onDelete?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onSelect?: (transactionId: number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
};

export function TransactionTable({
  categories = [],
  emptyMessage = "Henüz işlem eklenmedi.",
  selectedIds = [],
  transactions,
  onDelete,
  onEdit,
  onSelect,
  onSelectAll
}: TransactionTableProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const { language, t } = useLanguage();
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const selectedSet = new Set(selectedIds);
  const allSelected = transactions.length > 0 && transactions.every((transaction) => selectedSet.has(transaction.id));
  const hasActions = Boolean(onEdit || onDelete);
  const hasSelection = Boolean(onSelect && onSelectAll);

  return (
    <table className="table">
      <thead>
        <tr>
          {hasSelection ? (
            <th>
              <label className="check-label">
                <input
                  checked={allSelected}
                  type="checkbox"
                  onChange={(event) => onSelectAll?.(event.target.checked)}
                />
                {language === "en" ? "Select all" : "Tümünü seç"}
              </label>
            </th>
          ) : null}
          <th>{t("common.description")}</th>
          <th>{t("common.category")}</th>
          <th>{t("common.date")}</th>
          <th>{t("common.amount")}</th>
          {hasActions ? <th>{t("common.action")}</th> : null}
        </tr>
      </thead>
      <tbody>
        {transactions.length === 0 ? (
          <tr>
            <td className="muted" colSpan={(hasSelection ? 1 : 0) + (hasActions ? 5 : 4)}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          transactions.map((transaction) => (
            <tr key={transaction.id}>
              {hasSelection ? (
                <td>
                  <input
                    aria-label={`${transaction.description || t("common.action")} seç`}
                    checked={selectedSet.has(transaction.id)}
                    type="checkbox"
                    onChange={(event) => onSelect?.(transaction.id, event.target.checked)}
                  />
                </td>
              ) : null}
              <td>{transaction.description.trim() || "-"}</td>
              <td>{transaction.category_id ? categoryNames.get(transaction.category_id) ?? t("common.noCategory") : t("common.noCategory")}</td>
              <td>{formatDate(transaction.occurred_on, language)}</td>
              <td className={transaction.type === "income" ? "positive" : "negative"}>
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </td>
              {hasActions ? (
                <td>
                  <div className="table-actions">
                    {onEdit ? (
                      <button className="small-button" type="button" onClick={() => onEdit(transaction)}>
                        Düzenle
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button className="small-button danger" type="button" onClick={() => onDelete(transaction)}>
                        Sil
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
