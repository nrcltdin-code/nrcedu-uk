import type { ReactNode } from "react";
import Link from "next/link";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string } | ReactNode;
  actions?: ReactNode;
};

const isLink = (back: unknown): back is { href: string; label: string } =>
  typeof back === "object" && back !== null && "href" in back && "label" in back;

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {isLink(back) ? (
          <Link href={back.href} className="text-sm font-medium text-brand-700 hover:underline">
            ← {back.label}
          </Link>
        ) : back}
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
