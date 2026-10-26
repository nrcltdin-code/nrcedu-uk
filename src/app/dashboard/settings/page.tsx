import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import type { NavItem } from "@/lib/nav";
import { requirePermission } from "@/lib/session";
import { getSiteSettings, socialNetworks } from "@/lib/settings";
import { ContactForm, MenusForm, SocialForm, WelcomeForm } from "./settings-forms";

export const metadata: Metadata = { title: "Site settings", robots: { index: false } };

const lines = (items: NavItem[]) => items.map((item) => `${item.label} | ${item.href}`).join("\n");

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Site settings" description="Contact details, social links, menus and the welcome popup shown across the website." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  await requirePermission("SETTINGS", "edit");
  const { contact, social, menus, welcome } = await getSiteSettings();

  return (
    <div className="grid gap-6">
      <Card tone="solid" className="p-6">
        <h2 className="mb-4 text-lg font-bold">Contact details</h2>
        <ContactForm contact={contact} />
      </Card>
      <Card tone="solid" className="p-6">
        <h2 className="mb-4 text-lg font-bold">Welcome popup</h2>
        <WelcomeForm welcome={welcome} />
      </Card>
      <Card tone="solid" className="p-6">
        <h2 className="mb-4 text-lg font-bold">Social links</h2>
        <SocialForm social={social} networks={socialNetworks} />
      </Card>
      <Card tone="solid" className="p-6">
        <h2 className="mb-4 text-lg font-bold">Menus</h2>
        <MenusForm
          main={lines(menus.main)}
          footer={menus.footer.map((group) => `## ${group.title}\n${lines(group.items)}`).join("\n\n")}
        />
      </Card>
    </div>
  );
}
