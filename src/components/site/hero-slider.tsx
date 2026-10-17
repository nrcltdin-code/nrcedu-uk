"use client";

import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type Slide = {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonHref: string | null;
};

const INTERVAL_MS = 6000;

const outlineButton =
  "inline-flex h-12 items-center justify-center rounded-full border border-white/60 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-base";

// `socials` is rendered on the server (it needs site settings) and repeated in every slide.
export function HeroSlider({ slides, socials }: { slides: Slide[]; socials?: ReactNode }) {
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
      className="sky-backdrop relative isolate overflow-hidden rounded-[2rem] text-white"
    >
      {/* Only peeks in on smaller screens, where it would otherwise sit behind the text. */}
      <Cloud className="-left-32 -top-36 w-[22rem] opacity-90 lg:-left-36 lg:-top-28 lg:w-[30rem]" />
      {/* Left out on phones, where they would cover the slide controls. */}
      <Cloud className="-bottom-24 left-[22%] hidden w-[26rem] opacity-75 sm:block" />
      <Cloud className="-bottom-28 -right-24 hidden w-[32rem] opacity-90 sm:block" />

      {/* Every slide sits in the same grid cell, so the hero is as tall as its tallest slide. */}
      <div className="relative grid">
        {slides.map((slide, i) => {
          const active = i === current;
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={cn("[grid-area:1/1] transition-opacity duration-700", active ? "opacity-100" : "opacity-0")}
            >
              <div
                className={cn(
                  "grid h-full items-center gap-12 px-6 pb-32 pt-12 sm:px-12 sm:pt-16 lg:px-16 lg:pb-28 lg:pt-20",
                  slide.imageUrl && "md:grid-cols-[1.2fr_1fr]",
                )}
              >
                <div className={cn("max-w-xl transition-transform duration-700", active ? "translate-y-0" : "translate-y-3")}>
                  {slide.eyebrow && <p className="mb-4 text-sm font-medium text-white/90 sm:text-base">{slide.eyebrow}</p>}
                  <Heading className="text-[2.4rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                    {slide.title}
                  </Heading>
                  {slide.subtitle && <p className="mt-5 text-base text-white/90 sm:text-lg">{slide.subtitle}</p>}

                  <div className="mt-8 flex flex-wrap gap-3">
                    {slide.buttonLabel && slide.buttonHref && (
                      <Link href={slide.buttonHref} className={buttonStyles({ variant: "accent", className: "group h-12 sm:text-base" })}>
                        {slide.buttonLabel}
                        <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
                      </Link>
                    )}
                    {slide.buttonHref !== "/contact" && (
                      <Link href="/contact" className={outlineButton}>
                        Contact us
                      </Link>
                    )}
                  </div>

                  {socials && <div className="mt-8">{socials}</div>}
                </div>

                {slide.imageUrl && <SlidePhoto src={slide.imageUrl} priority={i === 0} active={active} />}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        // Bottom-left, under the text, and high enough to clear the stats bar that overlaps
        // the bottom of the hero.
        <div className="absolute bottom-14 left-6 flex items-center gap-3 sm:bottom-16 sm:left-12 lg:left-16">
          <ArrowButton label="Previous slide" onClick={() => go(-1)} path="M15 6l-6 6 6 6" />
          <div className="flex gap-1">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === current}
                className="group flex h-8 items-center px-0.5"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all",
                    i === current ? "w-7 bg-white" : "w-2.5 bg-white/45 group-hover:bg-white/75",
                  )}
                />
              </button>
            ))}
          </div>
          <ArrowButton label="Next slide" onClick={() => go(1)} path="M9 6l6 6-6 6" />
        </div>
      )}
    </section>
  );
}

// The slide photo on a clean white card with sparkles around it. Shown from tablet width up;
// on phones the slide is text only, which keeps the hero short.
function SlidePhoto({ src, priority, active }: { src: string; priority: boolean; active: boolean }) {
  return (
    <div
      className={cn(
        "relative mx-auto hidden w-full max-w-[24rem] transition duration-700 md:mr-0 md:block lg:mr-6",
        active ? "scale-100" : "scale-[0.97]",
      )}
    >
      <div className="relative aspect-[6/7] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_60px_-20px_rgb(18_52_83/0.55)] ring-1 ring-white/70">
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 384px, 40vw"
          priority={priority}
          className="object-cover object-[center_20%]"
        />
      </div>

      {/* Decoration, after the reference design's hand-drawn sparkles. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="absolute -left-12 -top-8 size-10 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M30 34L37 31 M24 24L36 17 M20 15L24 3" />
      </svg>
      <Sparkle className="absolute -left-7 top-[42%] size-11 text-white motion-safe:animate-twinkle" />
      <Sparkle className="absolute -right-5 top-[18%] size-8 text-white motion-safe:animate-twinkle motion-safe:[animation-delay:1s]" />
      <Sparkle className="absolute -bottom-5 right-8 size-10 text-accent-400 motion-safe:animate-twinkle motion-safe:[animation-delay:2s]" />
    </div>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="-2 -2 28 28"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M12 0C12 6.6 17.4 12 24 12 17.4 12 12 17.4 12 24 12 17.4 6.6 12 0 12 6.6 12 12 6.6 12 0Z" />
    </svg>
  );
}

// Soft cloud built from overlapping puffs, white on top and shaded blue underneath.
function Cloud({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 200"
      className={cn("pointer-events-none absolute blur-[2px]", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f1f6fc" />
          <stop offset="1" stopColor="#bcd4ec" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <circle cx="60" cy="150" r="40" />
        <circle cx="115" cy="125" r="58" />
        <circle cx="190" cy="92" r="78" />
        <circle cx="270" cy="108" r="66" />
        <circle cx="336" cy="145" r="46" />
        <rect x="50" y="130" width="300" height="62" rx="31" />
      </g>
    </svg>
  );
}

function ArrowButton({ label, onClick, path }: { label: string; onClick: () => void; path: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full border border-white/50 bg-white/15 backdrop-blur transition-colors hover:bg-white/30"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}
