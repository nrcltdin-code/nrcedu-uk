import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { deleteSlide, moveSlide, setSlidePublished } from "./actions";
import { SlideForm } from "./slide-form";

export const metadata: Metadata = { title: "Home page slider", robots: { index: false } };

export default function SlidesPage({ searchParams }: PageProps<"/dashboard/slides">) {
  return (
    <>
      <PageHeader title="Home page slider" description="Slides appear at the top of the home page, in the order shown here." />
      <Suspense fallback={<Card tone="solid">Loading slides…</Card>}>
        <SlidesManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SlidesManager({ searchParams }: Pick<PageProps<"/dashboard/slides">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const { edit } = await searchParams;
  const slides = await db.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const editing = slides.find((slide) => slide.id === edit) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <ul className="grid gap-4">
        {slides.length === 0 && (
          <Card tone="solid">No slides yet. Add the first one with the form.</Card>
        )}
        {slides.map((slide, index) => (
          <li key={slide.id}>
            <Card tone="solid" className="flex gap-4 p-4">
              <div className="bg-deep relative h-24 w-36 shrink-0 overflow-hidden rounded-xl">
                {slide.imageUrl && <Image src={slide.imageUrl} alt="" fill sizes="144px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-bold">{slide.title}</h2>
                  <Badge tone={slide.isPublished ? "success" : "neutral"}>
                    {slide.isPublished ? "On the website" : "Hidden"}
                  </Badge>
                </div>
                {slide.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted">{slide.subtitle}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/slides?edit=${slide.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>
                    Edit
                  </Link>
                  <form action={setSlidePublished.bind(null, slide.id, !slide.isPublished)}>
                    <Button variant="ghost" size="sm">
                      {slide.isPublished ? "Hide" : "Show"}
                    </Button>
                  </form>
                  <form action={moveSlide.bind(null, slide.id, "up")}>
                    <Button variant="ghost" size="sm" disabled={index === 0} aria-label="Move up">
                      ↑
                    </Button>
                  </form>
                  <form action={moveSlide.bind(null, slide.id, "down")}>
                    <Button variant="ghost" size="sm" disabled={index === slides.length - 1} aria-label="Move down">
                      ↓
                    </Button>
                  </form>
                  {/* Two steps, so a slide cannot be deleted with one stray click. */}
                  <details className="relative">
                    <summary className={buttonStyles({ variant: "ghost", size: "sm", className: "cursor-pointer list-none text-red-700 hover:bg-red-500/10 [&::-webkit-details-marker]:hidden" })}>
                      Delete
                    </summary>
                    <form action={deleteSlide.bind(null, slide.id)} className="glass-solid absolute left-0 top-full z-10 mt-1 w-56 rounded-2xl p-3">
                      <p className="text-sm">Delete this slide for good?</p>
                      <Button size="sm" className="mt-2 bg-red-600 bg-none shadow-none hover:bg-red-700">
                        Yes, delete
                      </Button>
                    </form>
                  </details>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">{editing ? "Edit slide" : "Add a slide"}</h2>
        {/* key resets the fields when switching between slides or back to "add". */}
        <SlideForm key={editing?.id ?? "new"} slide={editing} nextPosition={slides.length} />
      </Card>
    </div>
  );
}
