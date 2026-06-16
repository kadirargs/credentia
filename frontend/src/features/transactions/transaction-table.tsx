"use client";

import type { Category } from "@/features/categories/types";
import { useCurrencyFormatter } from "@/components/theme/theme-provider";
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
                Tümünü seç
              </label>
            </th>
          ) : null}
          <th>Açıklama</th>
          <th>Kategori</th>
          <th>Tarih</th>
          <th>Tutar</th>
          {hasActions ? <th>İşlem</th> : null}
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
                    aria-label={`${transaction.description || "İşlem"} seç`}
                    checked={selectedSet.has(transaction.id)}
                    type="checkbox"
                    onChange={(event) => onSelect?.(transaction.id, event.target.checked)}
                  />
                </td>
              ) : null}
              <td>{transaction.description.trim() || "-"}</td>
              <td>{transaction.category_id ? categoryNames.get(transaction.category_id) ?? "Kategori yok" : "Kategori yok"}</td>
              <td>{formatDate(transaction.occurred_on)}</td>
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
