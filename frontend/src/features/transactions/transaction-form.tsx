"use client";

import { useEffect, useMemo, useState } from "react";

import type { Budget } from "@/features/budgets/types";
import type { Category } from "@/features/categories/types";
import { apiPost, apiPut } from "@/lib/api";
import { formatMonthYear } from "@/lib/format";

import type { Transaction } from "./transaction-table";

type TransactionFormProps = {
  budgets: Budget[];
  categories: Category[];
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
  onCreated: (transaction: Transaction) => void;
  onUpdated: (transaction: Transaction) => void;
};

type TransactionPayload = {
  type: "income" | "expense";
  amount: number;
  occurred_on: string;
  category_id: number;
  description: string;
};

function periodFromDate(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { month, year };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function TransactionForm({
  budgets,
  categories,
  editingTransaction,
  onCancelEdit,
  onCreated,
  onUpdated
}: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = editingTransaction !== null;

  useEffect(() => {
    if (!editingTransaction) {
      return;
    }

    setType(editingTransaction.type);
    setAmount(String(editingTransaction.amount));
    setOccurredOn(editingTransaction.occurred_on);
    setCategoryId(editingTransaction.category_id ? String(editingTransaction.category_id) : "");
    setDescription(editingTransaction.description);
    setStatus("idle");
    setErrorMessage("");
  }, [editingTransaction]);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );
  const selectedCategoryId = categoryId ? Number(categoryId) : null;
  const selectedPeriod = periodFromDate(occurredOn);
  const selectedCategoryBudgets = budgets.filter((budget) => budget.category_id === selectedCategoryId);
  const matchingBudget = selectedCategoryBudgets.find(
    (budget) => budget.month === selectedPeriod.month && budget.year === selectedPeriod.year
  );
  const latestCategoryBudget = selectedCategoryBudgets[0];

  function validateForm() {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return "Tutar 0'dan büyük olmalı.";
    }

    if (!isValidDate(occurredOn)) {
      return "Geçerli bir tarih seçmelisin.";
    }

    if (!categoryId) {
      return "İşlem için bir kategori seçmelisin.";
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
      const payload: TransactionPayload = {
        type,
        amount: Number(amount),
        occurred_on: occurredOn,
        category_id: Number(categoryId),
        description: description.trim()
      };
      const saved = isEditing
        ? await apiPut<Transaction, TransactionPayload>(`/api/transactions/${editingTransaction.id}`, payload)
        : await apiPost<Transaction, TransactionPayload>("/api/transactions", payload);

      if (isEditing) {
        onUpdated(saved);
      } else {
        onCreated(saved);
      }

      window.dispatchEvent(new Event("credentia:transactions-updated"));
      resetForm();
    } catch {
      setErrorMessage("İşlem kaydedilemedi. Bilgileri kontrol edip tekrar dene.");
    } finally {
      setStatus("idle");
    }
  }

  function resetForm() {
    setAmount("");
    setCategoryId("");
    setDescription("");
    setType("expense");
    setOccurredOn(new Date().toISOString().slice(0, 10));
    setStatus("idle");
    setErrorMessage("");
    onCancelEdit();
  }

  function handleTypeChange(nextType: "income" | "expense") {
    setType(nextType);
    setCategoryId("");
    setErrorMessage("");
  }

  function syncDateToBudget() {
    if (!latestCategoryBudget) return;
    setOccurredOn(`${latestCategoryBudget.year}-${String(latestCategoryBudget.month).padStart(2, "0")}-01`);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="transactionType">Tür</label>
        <select
          id="transactionType"
          value={type}
          onChange={(event) => handleTypeChange(event.target.value as "income" | "expense")}
        >
          <option value="expense">Gider</option>
          <option value="income">Gelir</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="amount">Tutar</label>
        <input
          id="amount"
          min="0.01"
          name="amount"
          step="0.01"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="occurredOn">Tarih</label>
        <input
          id="occurredOn"
          name="occurredOn"
          type="date"
          value={occurredOn}
          onChange={(event) => setOccurredOn(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="categoryId">Kategori</label>
        <select id="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Kategori seç</option>
          {filteredCategories.map((category) => {
            const hasMatchingBudget = budgets.some(
              (budget) =>
                budget.category_id === category.id &&
                budget.month === selectedPeriod.month &&
                budget.year === selectedPeriod.year
            );
            return (
              <option key={category.id} value={category.id}>
                {category.name}
                {type === "expense" && hasMatchingBudget ? " - bütçeli" : ""}
              </option>
            );
          })}
        </select>
        {filteredCategories.length === 0 ? (
          <p className="field-hint">Bu tür için önce kategori eklemelisin.</p>
        ) : null}
      </div>

      {type === "expense" && selectedCategoryId && matchingBudget ? (
        <p className="positive">
          Bu işlem {formatMonthYear(matchingBudget.month, matchingBudget.year)} bütçesine yansıyacak.
        </p>
      ) : null}

      {type === "expense" && selectedCategoryId && !matchingBudget && latestCategoryBudget ? (
        <div className="inline-alert">
          <p>
            Bu kategorinin bütçesi {formatMonthYear(latestCategoryBudget.month, latestCategoryBudget.year)} için.
            Seçilen işlem tarihi farklı ayda olduğu için bütçe güncellenmez.
          </p>
          <button type="button" onClick={syncDateToBudget}>
            Tarihi bütçe ayına al
          </button>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="description">Açıklama</label>
        <input
          id="description"
          maxLength={255}
          name="description"
          placeholder="İsteğe bağlı"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="form-actions">
        <button className="button" disabled={status === "saving"} type="submit">
          {status === "saving" ? "Kaydediliyor" : isEditing ? "İşlemi güncelle" : "İşlem ekle"}
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
