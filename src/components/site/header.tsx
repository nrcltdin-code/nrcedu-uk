import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { GuestActions, HeaderActions } from "@/components/site/header-actions";
import { MobileMenu } from "@/components/site/mobile-menu";
import { ActiveNavList, NavList } from "@/components/site/nav-links";
import { Container } from "@/components/ui/section";
import { getTestPrepPages } from "@/lib/data/home";
import { getSiteSettings } from "@/lib/settings";

export async function Header() {
  const [{ menus }, tests] = await Promise.all([getSiteSettings(), getTestPrepPages()]);
  // About lives in the footer, to keep the header on one line. Test Prep opens a list of the
  // published exam guides (managed in Dashboard → Test prep).
  const mainNav = menus.main
    .filter((item) => item.href !== "/about")
    .map((item) =>
      item.href === "/test-prep" && tests.length
        ? { ...item, children: [...tests.map((t) => ({ label: t.name, href: `/test-prep/${t.slug}` })), { label: "All tests", href: "/test-prep" }] }
        : item,
    );
  const actions = (
    <Suspense fallback={<GuestActions />}>
      <HeaderActions />
    </Suspense>
  );

  return (
    <header className="sticky top-3 z-40 mt-3">
      <Container>
        <div className="glass flex items-center justify-between gap-4 rounded-full py-2 pl-4 pr-2">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/nrc-logo.jpeg" alt="" width={48} height={48} priority className="rounded-full" />
            <span className="font-display text-lg font-bold text-brand-800">
              NRC <span className="hidden font-medium text-muted sm:inline">Education</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden xl:block">
            <Suspense fallback={<NavList items={mainNav} />}>
              <ActiveNavList items={mainNav} />
            </Suspense>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">{actions}</div>
            <MobileMenu items={mainNav} actions={actions} />
          </div>
        </div>
      </Container>
    </header>
  );
}
