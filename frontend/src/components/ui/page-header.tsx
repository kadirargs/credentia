"use client";

import { Plus } from "lucide-react";

import { useLanguage } from "@/components/theme/theme-provider";
import type { TranslationKey } from "@/lib/translations";

type PageHeaderProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  eyebrowKey?: TranslationKey;
  titleKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  actionLabel?: string;
};

export function PageHeader({ eyebrow, title, description, eyebrowKey, titleKey, descriptionKey, actionLabel }: PageHeaderProps) {
  const { t } = useLanguage();
  const resolvedEyebrow = eyebrowKey ? t(eyebrowKey) : eyebrow;
  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedDescription = descriptionKey ? t(descriptionKey) : description;

  return (
    <header className="page-header">
      <div>
        {resolvedEyebrow ? <p className="eyebrow">{resolvedEyebrow}</p> : null}
        {resolvedTitle ? <h1>{resolvedTitle}</h1> : null}
        {resolvedDescription ? <p className="muted">{resolvedDescription}</p> : null}
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
