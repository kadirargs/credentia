"use client";

import { useEffect, useState } from "react";

import { apiPost, apiPut } from "@/lib/api";

import type { Category } from "./types";

type CategoryFormProps = {
  editingCategory: Category | null;
  onCancelEdit: () => void;
  onCreated: (category: Category) => void;
  onUpdated: (category: Category) => void;
};

type CategoryPayload = {
  name: string;
  type: "income" | "expense";
  color: string;
};

const defaultColors = ["#2563eb", "#0f766e", "#b7791f", "#c2410c", "#7c3aed"];

const suggestions: Record<CategoryPayload["type"], string[]> = {
  income: ["Maaş", "Burs", "Freelance", "Yatırım", "Ek gelir"],
  expense: ["Market", "Yemek", "Ulaşım", "Kira", "Faturalar", "Sağlık"]
};

export function CategoryForm({ editingCategory, onCancelEdit, onCreated, onUpdated }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryPayload["type"]>("expense");
  const [color, setColor] = useState(defaultColors[0]);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const isEditing = editingCategory !== null;

  useEffect(() => {
    if (!editingCategory) return;

    setName(editingCategory.name);
    setType(editingCategory.type);
    setColor(editingCategory.color);
    setStatus("idle");
    setErrorMessage("");
  }, [editingCategory]);

  function validateForm() {
    if (name.trim().length < 2) {
      return "Kategori adı en az 2 karakter olmalı.";
    }

    if (!color) {
      return "Kategori için bir renk seçmelisin.";
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
      const payload: CategoryPayload = {
        name: name.trim(),
        type,
        color
      };
      const saved = isEditing
        ? await apiPut<Category, CategoryPayload>(`/api/categories/${editingCategory.id}`, payload)
        : await apiPost<Category, CategoryPayload>("/api/categories", payload);

      if (isEditing) {
        onUpdated(saved);
      } else {
        onCreated(saved);
      }

      window.dispatchEvent(new Event("credentia:categories-updated"));
      window.dispatchEvent(new Event("credentia:transactions-updated"));
      window.dispatchEvent(new Event("credentia:budgets-updated"));
      resetForm();
    } catch (error) {
      if (error instanceof Error && error.message.includes("409")) {
        setErrorMessage("Bu isimde bir kategori zaten var.");
        return;
      }
      if (error instanceof Error && error.message.includes("400")) {
        setErrorMessage("İşlem veya bütçe bağlı olan kategorinin türü değiştirilemez.");
        return;
      }
      setErrorMessage("Kategori kaydedilemedi. Bilgileri kontrol edip tekrar dene.");
    } finally {
      setStatus("idle");
    }
  }

  function resetForm() {
    setName("");
    setType("expense");
    setColor(defaultColors[0]);
    setStatus("idle");
    setErrorMessage("");
    onCancelEdit();
  }

  function handleTypeChange(nextType: CategoryPayload["type"]) {
    setType(nextType);
    setErrorMessage("");
    if (!isEditing) {
      setName("");
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <span>Tür</span>
        <div className="segmented-control" role="radiogroup" aria-label="Kategori türü">
          <button
            aria-checked={type === "expense"}
            className={type === "expense" ? "selected" : ""}
            role="radio"
            type="button"
            onClick={() => handleTypeChange("expense")}
          >
            Gider
          </button>
          <button
            aria-checked={type === "income"}
            className={type === "income" ? "selected" : ""}
            role="radio"
            type="button"
            onClick={() => handleTypeChange("income")}
          >
            Gelir
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="categoryName">Kategori adı</label>
        <input
          id="categoryName"
          maxLength={80}
          name="categoryName"
          placeholder={type === "income" ? "Örn. Maaş" : "Örn. Market"}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {!isEditing ? (
          <div className="suggestion-list" aria-label="Hazır kategori seçenekleri">
            {suggestions[type].map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setName(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="field">
        <span>Renk</span>
        <div className="color-picker" role="radiogroup" aria-label="Kategori rengi">
          {defaultColors.map((item) => (
            <button
              aria-checked={color === item}
              aria-label={`Renk ${item}`}
              className={`color-option ${color === item ? "selected" : ""}`}
              key={item}
              role="radio"
              style={{ background: item }}
              type="button"
              onClick={() => setColor(item)}
            />
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button className="button" disabled={status === "saving"} type="submit">
          {status === "saving" ? "Kaydediliyor" : isEditing ? "Kategori güncelle" : "Kategori ekle"}
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
