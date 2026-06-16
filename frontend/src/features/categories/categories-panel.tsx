"use client";

import { useEffect, useState } from "react";

import { apiDelete, apiGet } from "@/lib/api";

import { CategoryForm } from "./category-form";
import { CategoryList } from "./category-list";
import type { Category } from "./types";

function sortCategories(categories: Category[]) {
  return [...categories].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "income" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "tr");
  });
}

export function CategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiGet<Category[]>("/api/categories");
        setCategories(sortCategories(data));
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }

    void loadCategories();
  }, []);

  function emitCategoryChanges() {
    window.dispatchEvent(new Event("credentia:categories-updated"));
    window.dispatchEvent(new Event("credentia:transactions-updated"));
    window.dispatchEvent(new Event("credentia:budgets-updated"));
  }

  function handleCreated(category: Category) {
    setCategories((current) => sortCategories([...current, category]));
  }

  function handleUpdated(category: Category) {
    setCategories((current) => sortCategories(current.map((item) => (item.id === category.id ? category : item))));
    setEditingCategory(null);
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `"${category.name}" kategorisini silmek istiyor musun? Bu kategoriye bağlı işlemler ve bütçeler de silinecek.`
    );
    if (!confirmed) return;

    try {
      await apiDelete(`/api/categories/${category.id}`);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editingCategory?.id === category.id) {
        setEditingCategory(null);
      }
      emitCategoryChanges();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="grid content-grid">
      <section className="card">
        <h2>{editingCategory ? "Kategori düzenle" : "Yeni kategori"}</h2>
        <div style={{ marginTop: 16 }}>
          <CategoryForm
            editingCategory={editingCategory}
            onCancelEdit={() => setEditingCategory(null)}
            onCreated={handleCreated}
            onUpdated={handleUpdated}
          />
        </div>
      </section>

      <section className="card">
        <h2>Kategori listesi</h2>
        <div style={{ marginTop: 16 }}>
          {status === "loading" ? <div className="state-card">Kategoriler yükleniyor.</div> : null}
          {status === "error" ? (
            <div className="state-card error">Kategoriler alınamadı veya işlem tamamlanamadı. Backend çalışıyor mu?</div>
          ) : null}
          {status === "ready" ? (
            <CategoryList categories={categories} onDelete={handleDelete} onEdit={setEditingCategory} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
