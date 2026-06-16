import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { CategoriesPanel } from "@/features/categories/categories-panel";

export default function CategoriesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="categories.eyebrow"
        titleKey="categories.title"
        descriptionKey="categories.description"
      />
      <CategoriesPanel />
    </AppShell>
  );
}
