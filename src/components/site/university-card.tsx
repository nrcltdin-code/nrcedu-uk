import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { UniversityCardData } from "@/lib/data/catalogue";

// First letters of the first two words, shown when a university has no logo.
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

export function UniversityCard({ university }: { university: UniversityCardData }) {
  const href = `/universities/${university.slug}`;
  const location = [university.city, university.country.name].filter(Boolean).join(", ");

  return (
    <Card
      tone="solid"
      className="group flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-600/20"
    >
      <Link href={href} tabIndex={-1} aria-hidden="true" className="bg-deep relative block h-48 overflow-hidden">
        {university.coverUrl && (
          <Image
            src={university.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        {/* Only darkens the bottom edge, so the photo keeps its own colours. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-deep-900/75 to-transparent" />
        {university.isOfficialPartner && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-800 shadow-md">
            <span className="size-1.5 rounded-full bg-accent-500" />
            Official representative
          </span>
        )}
        {university.ranking && (
          <span className="absolute right-4 top-4 rounded-full bg-deep-900/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            World rank #{university.ranking}
          </span>
        )}
      </Link>

      <div className="relative flex flex-1 flex-col px-6 pb-6 pt-10">
        <span
          aria-hidden="true"
          className="absolute -top-8 left-6 flex size-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg"
        >
          {university.logoUrl ? (
            <Image src={university.logoUrl} alt="" width={56} height={56} className="size-full object-contain" />
          ) : (
            <span className="flex size-full items-center justify-center bg-linear-to-br from-brand-600 to-sky-500 font-display text-lg font-extrabold text-white">
              {initials(university.name)}
            </span>
          )}
        </span>

        <h3 className="text-lg font-bold leading-snug">
          <Link href={href} className="hover:text-brand-700">
            {university.name}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <Icon name="pin" className="size-4 shrink-0 text-brand-600" />
          {location}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-brand-900/10 pt-4">
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink/80">
              <Icon name="cap" className="size-4 text-brand-600" />
              {university._count.courses} {university._count.courses === 1 ? "course" : "courses"}
            </span>
            <Link href={`${href}#courses`} className={buttonStyles({ variant: "accent", size: "sm" })}>
              View &amp; apply
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
