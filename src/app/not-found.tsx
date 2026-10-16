import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { LostIllustration } from "@/components/site/lost-illustration";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/section";

export const metadata: Metadata = { title: "Page not found" };

const shortcuts = [
  { label: "Universities", href: "/universities" },
  { label: "Destinations", href: "/destinations" },
  { label: "Subjects", href: "/subjects" },
  { label: "Blog", href: "/blog" },
];

// Shown for any address that does not exist, and wherever a page calls notFound().
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center py-12 sm:py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <LostIllustration className="mx-auto w-full max-w-md md:order-2" />
          <div className="text-center md:text-left">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-600">Error 404</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              This page has <span className="text-gradient">flown off course</span>
            </h1>
            <p className="mt-4 text-lg text-muted">
              The page you are looking for may have moved, or the link may be wrong. Let&apos;s get you back on track.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href="/" className={buttonStyles({ variant: "accent" })}>Back to home</Link>
              <Link href="/contact" className={buttonStyles({ variant: "glass" })}>Contact us</Link>
            </div>
            <p className="mt-8 text-sm text-muted">Or try one of these:</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
              {shortcuts.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="glass inline-block rounded-full px-4 py-1.5 text-sm font-semibold text-brand-700 hover:bg-white/75">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
