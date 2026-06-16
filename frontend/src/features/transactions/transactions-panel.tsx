"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Budget } from "@/features/budgets/types";
import type { Category } from "@/features/categories/types";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

import { TransactionForm } from "./transaction-form";
import { TransactionTable, type Transaction } from "./transaction-table";

type TransactionTypeFilter = "all" | "income" | "expense";

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((a, b) => b.id - a.id);
}

export function TransactionsPanel() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadData = useCallback(async () => {
    try {
      const [transactionData, categoryData, budgetData] = await Promise.all([
        apiGet<Transaction[]>("/api/transactions"),
        apiGet<Category[]>("/api/categories"),
        apiGet<Budget[]>("/api/budgets")
      ]);
      setTransactions(sortTransactions(transactionData));
      setCategories(categoryData);
      setBudgets(budgetData);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
        if (categoryFilter && transaction.category_id !== Number(categoryFilter)) return false;
        if (startDate && transaction.occurred_on < startDate) return false;
        if (endDate && transaction.occurred_on > endDate) return false;
        return true;
      }),
    [categoryFilter, endDate, startDate, transactions, typeFilter]
  );

  const filteredFilterCategories = useMemo(
    () => (typeFilter === "all" ? categories : categories.filter((category) => category.type === typeFilter)),
    [categories, typeFilter]
  );

  useEffect(() => {
    if (!categoryFilter) return;

    const selectedCategory = categories.find((category) => category.id === Number(categoryFilter));
    if (typeFilter !== "all" && selectedCategory?.type !== typeFilter) {
      setCategoryFilter("");
    }
  }, [categories, categoryFilter, typeFilter]);

  const visibleSelectedIds = selectedIds.filter((id) => filteredTransactions.some((transaction) => transaction.id === id));
  const hasFilters = typeFilter !== "all" || Boolean(categoryFilter || startDate || endDate);

  function handleTypeFilterChange(nextType: TransactionTypeFilter) {
    setTypeFilter(nextType);

    if (!categoryFilter || nextType === "all") return;

    const selectedCategory = categories.find((category) => category.id === Number(categoryFilter));
    if (selectedCategory?.type !== nextType) {
      setCategoryFilter("");
    }
  }

  function handleCreated(transaction: Transaction) {
    setTransactions((current) => sortTransactions([transaction, ...current]));
  }

  function handleUpdated(transaction: Transaction) {
    setTransactions((current) => sortTransactions(current.map((item) => (item.id === transaction.id ? transaction : item))));
    setEditingTransaction(null);
  }

  async function handleDelete(transaction: Transaction) {
    const confirmed = window.confirm(`"${transaction.description || "Bu işlem"}" kaydını silmek istiyor musun?`);
    if (!confirmed) return;

    try {
      await apiDelete(`/api/transactions/${transaction.id}`);
      setTransactions((current) => current.filter((item) => item.id !== transaction.id));
      setSelectedIds((current) => current.filter((id) => id !== transaction.id));
      if (editingTransaction?.id === transaction.id) {
        setEditingTransaction(null);
      }
      window.dispatchEvent(new Event("credentia:transactions-updated"));
    } catch {
      setStatus("error");
    }
  }

  function clearFilters() {
    setTypeFilter("all");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
  }

  function handleSelect(transactionId: number, selected: boolean) {
    setSelectedIds((current) =>
      selected ? Array.from(new Set([...current, transactionId])) : current.filter((id) => id !== transactionId)
    );
  }

  function handleSelectAll(selected: boolean) {
    const visibleIds = filteredTransactions.map((transaction) => transaction.id);
    setSelectedIds((current) => {
      if (selected) {
        return Array.from(new Set([...current, ...visibleIds]));
      }
      return current.filter((id) => !visibleIds.includes(id));
    });
  }

  async function handleBulkDelete() {
    if (visibleSelectedIds.length === 0) return;

    const confirmed = window.confirm(`${visibleSelectedIds.length} işlemi silmek istiyor musun?`);
    if (!confirmed) return;

    try {
      await apiPost<{ deleted: number }, { ids: number[] }>("/api/transactions/bulk-delete", {
        ids: visibleSelectedIds
      });
      setTransactions((current) => current.filter((item) => !visibleSelectedIds.includes(item.id)));
      if (editingTransaction && visibleSelectedIds.includes(editingTransaction.id)) {
        setEditingTransaction(null);
      }
      setSelectedIds((current) => current.filter((id) => !visibleSelectedIds.includes(id)));
      window.dispatchEvent(new Event("credentia:transactions-updated"));
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="grid content-grid transactions-grid">
      <section className="card">
        <h2>{editingTransaction ? "İşlem düzenle" : "Yeni işlem"}</h2>
        <div style={{ marginTop: 16 }}>
          <TransactionForm
            budgets={budgets}
            categories={categories}
            editingTransaction={editingTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
            onCreated={handleCreated}
            onUpdated={handleUpdated}
          />
        </div>
      </section>

      <section className="card">
        <h2>İşlem listesi</h2>
        <div className="filter-grid" style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="typeFilter">Tür</label>
            <select id="typeFilter" value={typeFilter} onChange={(event) => handleTypeFilterChange(event.target.value as TransactionTypeFilter)}>
              <option value="all">Tümü</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="categoryFilter">Kategori</label>
            <select id="categoryFilter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">Tümü</option>
              {filteredFilterCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="startDate">Başlangıç</label>
            <input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="endDate">Bitiş</label>
            <input id="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>

          <button className="secondary-button" type="button" onClick={clearFilters}>
            Temizle
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          {status === "loading" ? <div className="state-card">İşlemler yükleniyor.</div> : null}
          {status === "error" ? (
            <div className="state-card error">İşlemler alınamadı veya işlem tamamlanamadı. Backend çalışıyor mu?</div>
          ) : null}
          {status === "ready" ? (
            <>
              <div className="bulk-actions">
                <span className="muted">{visibleSelectedIds.length} işlem seçildi</span>
                <button
                  className="small-button danger"
                  disabled={visibleSelectedIds.length === 0}
                  type="button"
                  onClick={handleBulkDelete}
                >
                  Seçilenleri sil
                </button>
              </div>
              <div className="table-scroll">
                <TransactionTable
                  categories={categories}
                  emptyMessage={hasFilters ? "Bu filtrelere uygun işlem bulunamadı." : "Henüz işlem yok."}
                  selectedIds={selectedIds}
                  transactions={filteredTransactions}
                  onDelete={handleDelete}
                  onEdit={setEditingTransaction}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                />
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
