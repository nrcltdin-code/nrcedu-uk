"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonHref: string | null;
};

const INTERVAL_MS = 6000;

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  // Guards against the list getting shorter after a slide is removed in the admin panel.
  const current = count ? index % count : 0;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  const go = (step: number) => setIndex((current + step + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="bg-deep relative isolate overflow-hidden rounded-[2rem] text-white"
    >
      <div className="relative min-h-[30rem] sm:min-h-[34rem]">
        {slides.map((slide, i) => {
          const active = i === current;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                active ? "opacity-100" : "opacity-0",
              )}
            >
              {slide.imageUrl && (
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1152px) 1104px, 100vw"
                  priority={i === 0}
                  className="object-cover saturate-125"
                />
              )}
              {/* Darkens the photo so every slide is equally rich and readable, even with a
                  light or washed-out image. */}
              <div className="absolute inset-0 bg-linear-to-r from-deep-900/95 via-brand-800/75 to-brand-600/40" />
              <div className="absolute inset-0 bg-linear-to-t from-deep-900/60 to-transparent" />

              <div className="relative flex h-full min-h-[30rem] items-center p-6 pb-20 sm:min-h-[34rem] sm:p-12 sm:pb-24">
                <div className="max-w-xl rounded-3xl border border-white/20 bg-deep-900/45 p-6 shadow-2xl shadow-deep-900/40 backdrop-blur-lg sm:p-8">
                  <span aria-hidden="true" className="mb-5 block h-1.5 w-16 rounded-full bg-linear-to-r from-accent-400 to-orange-500" />
                  {i === 0 ? (
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{slide.title}</h1>
                  ) : (
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{slide.title}</h2>
                  )}
                  {slide.subtitle && <p className="mt-4 text-base text-white/85 sm:text-lg">{slide.subtitle}</p>}
                  {slide.buttonLabel && slide.buttonHref && (
                    <Link
                      href={slide.buttonHref}
                      className={buttonStyles({ variant: "accent", size: "lg", className: "mt-7" })}
                    >
                      {slide.buttonLabel}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-5 flex items-center justify-between px-6 sm:px-12">
          <div className="flex gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === current}
                className="group flex h-8 items-center"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all",
                    i === current ? "w-8 bg-accent-400" : "w-3 bg-white/50 group-hover:bg-white/80",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <ArrowButton label="Previous slide" onClick={() => go(-1)} path="M15 6l-6 6 6 6" />
            <ArrowButton label="Next slide" onClick={() => go(1)} path="M9 6l6 6-6 6" />
          </div>
        </div>
      )}
    </section>
  );
}

function ArrowButton({ label, onClick, path }: { label: string; onClick: () => void; path: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="glass-dark flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/25"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}
