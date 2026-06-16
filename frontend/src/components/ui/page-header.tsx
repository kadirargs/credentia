import { Plus } from "lucide-react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actionLabel?: string;
};

export function PageHeader({ eyebrow, title, description, actionLabel }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actionLabel ? (
        <button className="button" type="button">
          <Plus size={18} />
          {actionLabel}
        </button>
      ) : null}
    </header>
  );
}

