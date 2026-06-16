import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { CategoriesPanel } from "@/features/categories/categories-panel";

export default function CategoriesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Kategoriler"
        title="Harcama grupları"
        description="Kategorileri PostgreSQL'e kaydet ve gerçek API'den listele."
      />
      <CategoriesPanel />
    </AppShell>
  );
}
