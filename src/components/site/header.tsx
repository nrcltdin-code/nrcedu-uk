import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { GuestAccount, GuestActions, HeaderAccount, HeaderActions } from "@/components/site/header-actions";
import { MobileMenu } from "@/components/site/mobile-menu";
import { ActiveNavList, NavList } from "@/components/site/nav-links";
import { SocialIcons } from "@/components/site/social-icons";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/section";
import { getDestinations, getTestPrepPages } from "@/lib/data/home";
import { getSiteSettings, socialNetworks, telHref, whatsappHref } from "@/lib/settings";

// Two tiers. A slim top bar carries contact details, social links, Become an agent and the
// account link; it scrolls away. The glass bar below sticks, with only the logo, the menu and
// the two main actions, so it stays on one line. Phones get everything in the menu drawer.
export async function Header() {
  const [{ menus, contact, social }, tests, countries] = await Promise.all([getSiteSettings(), getTestPrepPages(), getDestinations()]);
  // About lives in the footer. Test Prep opens a list of the published exam guides.
  const mainNav = menus.main
    .filter((item) => item.href !== "/about")
    .map((item) =>
      item.href === "/test-prep" && tests.length
        ? { ...item, children: [...tests.map((t) => ({ label: t.name, href: `/test-prep/${t.slug}` })), { label: "All tests", href: "/test-prep" }] }
        : item.href === "/destinations" && countries.length
          ? { ...item, menuOnly: true, children: countries.map((c) => ({ label: c.name, href: `/destinations/${c.slug}` })) }
          : item,
    );
  // While the session is read, the visitor versions hold the space but stay invisible, so a
  // signed-in person never sees "Sign in" flash before their name.
  const actions = (
    <Suspense fallback={<span className="invisible contents"><GuestActions /></span>}>
      <HeaderActions />
    </Suspense>
  );
  const account = (
    <Suspense fallback={<span className="invisible contents"><GuestAccount /></span>}>
      <HeaderAccount />
    </Suspense>
  );
  const contactLinks = (
    <>
      <a href={telHref(contact.phone)} className="inline-flex items-center gap-1.5 hover:text-brand-700">
        <Icon name="phone" className="size-3.5" />
        {contact.phone}
      </a>
      <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-700">
        <Icon name="mail" className="size-3.5" />
        {contact.email}
      </a>
      {contact.whatsapp && (
        <a href={whatsappHref(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-brand-700">
          <Icon name="chat" className="size-3.5" />
          WhatsApp
        </a>
      )}
    </>
  );

  return (
    <>
      <div className="hidden text-xs text-ink/70 md:block">
        <Container className="flex items-center justify-between gap-4 py-2">
          <div className="flex min-w-0 items-center gap-5">{contactLinks}</div>
          <div className="flex shrink-0 items-center gap-4">
            <SocialIcons social={social} networks={socialNetworks} />
            <span aria-hidden className="h-4 w-px bg-brand-900/15" />
            <Link href="/become-an-agent" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-violet-600 px-3.5 py-1.5 font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:-translate-y-px hover:shadow-md">
              <Icon name="briefcase" className="size-3.5" />
              Become an agent
              <Icon name="arrowRight" className="size-3.5" />
            </Link>
            {account}
          </div>
        </Container>
      </div>

      <header className="sticky top-3 z-40 mt-3 md:mt-0">
        <Container>
          <div className="glass flex items-center justify-between gap-3 rounded-full py-2 pl-4 pr-2">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image src="/nrc-logo.jpeg" alt="" width={44} height={44} priority className="rounded-full" />
              <span className="flex flex-col whitespace-nowrap font-display leading-tight text-brand-800">
                <span className="text-lg font-bold">NRC</span>
                <span className="text-xs font-medium text-muted">Educational Consultant</span>
              </span>
            </Link>

            <nav aria-label="Main" className="hidden lg:block">
              <Suspense fallback={<NavList items={mainNav} />}>
                <ActiveNavList items={mainNav} />
              </Suspense>
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 sm:flex">{actions}</div>
              <MobileMenu
                items={mainNav}
                actions={actions}
                extras={
                  <div className="grid gap-3 text-sm text-ink/75">
                    {account}
                    <Link href="/become-an-agent" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-2.5 font-semibold text-white">
                      <Icon name="briefcase" className="size-4" />
                      Become an agent: earn commission
                    </Link>
                    <div className="grid gap-2">{contactLinks}</div>
                    <SocialIcons social={social} networks={socialNetworks} />
                  </div>
                }
              />
            </div>
          </div>
        </Container>
      </header>
    </>
  );
}
