import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { getSiteSettings, socialNetworks, telHref, whatsappHref } from "@/lib/settings";

export async function Footer() {
  // Cached so the copyright year can be read from the clock without making pages dynamic.
  "use cache";
  cacheLife("days");
  const year = new Date().getFullYear();
  const { contact, social, menus } = await getSiteSettings();
  const footerNav = menus.footer;
  const socials = socialNetworks.filter(({ key }) => social[key]);

  return (
    <footer className="bg-deep mt-auto text-white">
      <Container className="py-14">
        <div className="glass-dark flex flex-wrap items-center justify-between gap-6 rounded-3xl p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">Ready to study abroad?</h2>
            <p className="mt-1 text-white/80">Talk to a counsellor for free and plan your next step.</p>
          </div>
          <Link href="/consultation" className={buttonStyles({ variant: "accent", size: "lg" })}>
            Book a free consultation
          </Link>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="rounded-2xl bg-white p-1.5">
                <Image src="/nrc-logo.png" alt="" width={50} height={40} />
              </span>
              <span className="font-display text-lg font-bold">NRC Educational Consultants</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/75">
              University admissions, applications and student visa support for studying abroad.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>
                <a href={telHref(contact.phone)} className="text-white/85 hover:text-white">
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="text-white/85 hover:text-white">
                  {contact.email}
                </a>
              </li>
              {contact.whatsapp && (
                <li>
                  <a href={whatsappHref(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-white">
                    WhatsApp {contact.whatsapp}
                  </a>
                </li>
              )}
              {contact.address && <li className="whitespace-pre-line text-white/70">{contact.address}</li>}
            </ul>
            {socials.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2 text-sm" aria-label="Social media">
                {socials.map(({ key, label }) => (
                  <li key={key}>
                    <a href={social[key]} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full border border-white/20 px-3 py-1 text-white/85 hover:bg-white/10 hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {footerNav.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-accent-400">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {group.items.map((item) => (
                  <li key={`${item.label}${item.href}`}>
                    <Link href={item.href} className="text-white/80 hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-12 border-t border-white/15 pt-6 text-sm text-white/60">
          © {year} NRC Educational Consultants Ltd. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
