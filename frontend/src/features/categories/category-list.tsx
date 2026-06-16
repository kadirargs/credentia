import type { Category } from "./types";

type CategoryListProps = {
  categories: Category[];
  onDelete: (category: Category) => void;
  onEdit: (category: Category) => void;
};

const labels = {
  income: "Gelir kategorileri",
  expense: "Gider kategorileri"
};

export function CategoryList({ categories, onDelete, onEdit }: CategoryListProps) {
  if (categories.length === 0) {
    return <div className="empty-state">Henüz kategori yok. İlk kategorini soldaki formdan ekleyebilirsin.</div>;
  }

  return (
    <div className="category-groups">
      {(["income", "expense"] as const).map((type) => {
        const items = categories.filter((category) => category.type === type);

        return (
          <section className="category-group" key={type}>
            <h3>{labels[type]}</h3>
            {items.length === 0 ? (
              <p className="muted">Bu türde kategori yok.</p>
            ) : (
              <div className="status-list">
                {items.map((category) => (
                  <div className="status-row" key={category.id}>
                    <span>
                      <span className="swatch" style={{ background: category.color }} />
                      {category.name}
                    </span>
                    <div className="table-actions">
                      <button className="small-button" type="button" onClick={() => onEdit(category)}>
                        Düzenle
                      </button>
                      <button className="small-button danger" type="button" onClick={() => onDelete(category)}>
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
