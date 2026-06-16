"use client";

import { useEffect, useState } from "react";

import type { Category } from "@/features/categories/types";
import { apiPost, apiPut } from "@/lib/api";

import type { Budget } from "./types";

type BudgetFormProps = {
  categories: Category[];
  editingBudget: Budget | null;
  onCancelEdit: () => void;
  onCreated: (budget: Budget) => void;
  onUpdated: (budget: Budget) => void;
};

type BudgetPayload = {
  category_id: number;
  limit_amount: number;
  month: number;
  year: number;
};

const months = [
  { label: "Ocak", value: "1" },
  { label: "Şubat", value: "2" },
  { label: "Mart", value: "3" },
  { label: "Nisan", value: "4" },
  { label: "Mayıs", value: "5" },
  { label: "Haziran", value: "6" },
  { label: "Temmuz", value: "7" },
  { label: "Ağustos", value: "8" },
  { label: "Eylül", value: "9" },
  { label: "Ekim", value: "10" },
  { label: "Kasım", value: "11" },
  { label: "Aralık", value: "12" }
];

export function BudgetForm({ categories, editingBudget, onCancelEdit, onCreated, onUpdated }: BudgetFormProps) {
  const today = new Date();
  const expenseCategories = categories.filter((category) => category.type === "expense");
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const isEditing = editingBudget !== null;

  useEffect(() => {
    if (!editingBudget) {
      return;
    }

    setCategoryId(String(editingBudget.category_id));
    setLimitAmount(String(editingBudget.limit_amount));
    setMonth(String(editingBudget.month));
    setYear(String(editingBudget.year));
    setStatus("idle");
    setErrorMessage("");
  }, [editingBudget]);

  function validateForm() {
    const parsedAmount = Number(limitAmount);
    const parsedMonth = Number(month);
    const parsedYear = Number(year);

    if (!categoryId) {
      return "Bütçe için bir gider kategorisi seçmelisin.";
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return "Ayrılan bütçe 0'dan büyük olmalı.";
    }

    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return "Geçerli bir ay seçmelisin.";
    }

    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return "Yıl 2000 ile 2100 arasında olmalı.";
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setStatus("saving");
    setErrorMessage("");

    try {
      const payload: BudgetPayload = {
        category_id: Number(categoryId),
        limit_amount: Number(limitAmount),
        month: Number(month),
        year: Number(year)
      };
      const saved = isEditing
        ? await apiPut<Budget, BudgetPayload>(`/api/budgets/${editingBudget.id}`, payload)
        : await apiPost<Budget, BudgetPayload>("/api/budgets", payload);

      if (isEditing) {
        onUpdated(saved);
      } else {
        onCreated(saved);
      }

      window.dispatchEvent(new Event("credentia:budgets-updated"));
      resetForm();
    } catch (error) {
      if (error instanceof Error && error.message.includes("409")) {
        setErrorMessage("Bu kategori için seçilen ayda zaten bütçe var.");
        return;
      }
      setErrorMessage("Bütçe kaydedilemedi. Bilgileri kontrol edip tekrar dene.");
    } finally {
      setStatus("idle");
    }
  }

  function resetForm() {
    setCategoryId("");
    setLimitAmount("");
    setMonth(String(today.getMonth() + 1));
    setYear(String(today.getFullYear()));
    setStatus("idle");
    setErrorMessage("");
    onCancelEdit();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="budgetCategory">Kategori</label>
        <select
          id="budgetCategory"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Kategori seç</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {expenseCategories.length === 0 ? <p className="field-hint">Önce gider kategorisi eklemelisin.</p> : null}
      </div>

      <div className="field">
        <label htmlFor="limitAmount">Ayrılan bütçe</label>
        <input
          id="limitAmount"
          min="0.01"
          step="0.01"
          type="number"
          value={limitAmount}
          onChange={(event) => setLimitAmount(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="budgetMonth">Ay</label>
        <select id="budgetMonth" value={month} onChange={(event) => setMonth(event.target.value)}>
          {months.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="budgetYear">Yıl</label>
        <input
          id="budgetYear"
          max="2100"
          min="2000"
          type="number"
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
      </div>

      <div className="form-actions">
        <button className="button" disabled={status === "saving"} type="submit">
          {status === "saving" ? "Kaydediliyor" : isEditing ? "Bütçe güncelle" : "Bütçe ekle"}
        </button>
        {isEditing ? (
          <button className="secondary-button" type="button" onClick={resetForm}>
            Vazgeç
          </button>
        ) : null}
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
    </form>
  );
}
