import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/section";

// Closing call to action for inner pages.
export function CtaBand({ title, text }: { title: string; text: string }) {
  return (
    <Container className="pb-16 sm:pb-24">
      <div className="bg-vivid flex flex-wrap items-center justify-between gap-6 rounded-[2rem] p-8 text-white shadow-xl shadow-brand-900/20 sm:p-12">
        <div className="max-w-xl">
          <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
          <p className="mt-2 text-lg text-white/85">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/consultation" className={buttonStyles({ variant: "accent", size: "lg" })}>
            Book a free consultation
          </Link>
          <Link href="/contact" className={buttonStyles({ size: "lg", className: "border border-white/30 bg-white/10 bg-none shadow-none hover:bg-white/20" })}>
            Contact us
          </Link>
        </div>
      </div>
    </Container>
  );
}
