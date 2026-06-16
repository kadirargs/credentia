"use client";

import { useCallback, useEffect, useState } from "react";

import type { Category } from "@/features/categories/types";
import { apiDelete, apiGet } from "@/lib/api";
import { formatMonthYear } from "@/lib/format";

import { BudgetForm } from "./budget-form";
import { BudgetList } from "./budget-list";
import type { Budget } from "./types";

function sortBudgets(budgets: Budget[]) {
  return [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return a.category_name.localeCompare(b.category_name, "tr");
  });
}

export function BudgetsPanel() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadData = useCallback(async () => {
    try {
      const [budgetData, categoryData] = await Promise.all([
        apiGet<Budget[]>("/api/budgets"),
        apiGet<Category[]>("/api/categories")
      ]);
      setBudgets(sortBudgets(budgetData));
      setCategories(categoryData);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    function refreshBudgets() {
      void loadData();
    }

    window.addEventListener("focus", refreshBudgets);
    window.addEventListener("credentia:budgets-updated", refreshBudgets);
    window.addEventListener("credentia:transactions-updated", refreshBudgets);

    return () => {
      window.removeEventListener("focus", refreshBudgets);
      window.removeEventListener("credentia:budgets-updated", refreshBudgets);
      window.removeEventListener("credentia:transactions-updated", refreshBudgets);
    };
  }, [loadData]);

  function handleCreated(budget: Budget) {
    setBudgets((current) => sortBudgets([budget, ...current]));
  }

  function handleUpdated(budget: Budget) {
    setBudgets((current) => sortBudgets(current.map((item) => (item.id === budget.id ? budget : item))));
    setEditingBudget(null);
  }

  async function handleDelete(budget: Budget) {
    const confirmed = window.confirm(
      `${budget.category_name} için ${formatMonthYear(budget.month, budget.year)} bütçesini silmek istiyor musun?`
    );
    if (!confirmed) return;

    try {
      await apiDelete(`/api/budgets/${budget.id}`);
      setBudgets((current) => current.filter((item) => item.id !== budget.id));
      if (editingBudget?.id === budget.id) {
        setEditingBudget(null);
      }
      window.dispatchEvent(new Event("credentia:budgets-updated"));
    } catch {
      setStatus("error");
    }
  }

  if (status === "loading") {
    return <section className="card"><div className="state-card">Bütçeler yükleniyor.</div></section>;
  }

  if (status === "error") {
    return <section className="card"><div className="state-card error">Bütçeler alınamadı veya işlem tamamlanamadı. Backend çalışıyor mu?</div></section>;
  }

  return (
    <div className="grid content-grid">
      <section className="card">
        <h2>{editingBudget ? "Bütçe düzenle" : "Yeni bütçe"}</h2>
        <div style={{ marginTop: 16 }}>
          <BudgetForm
            categories={categories}
            editingBudget={editingBudget}
            onCancelEdit={() => setEditingBudget(null)}
            onCreated={handleCreated}
            onUpdated={handleUpdated}
          />
        </div>
      </section>

      <section className="card">
        <h2>Bütçe listesi</h2>
        <div style={{ marginTop: 16 }}>
          <BudgetList budgets={budgets} onDelete={handleDelete} onEdit={setEditingBudget} />
        </div>
      </section>
    </div>
  );
}
