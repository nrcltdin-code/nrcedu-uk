// children: a dropdown under the item (the header fills Test Prep with the published guides).
// menuOnly: the item only opens its dropdown; it is not a link itself.
export type NavItem = { label: string; href: string; children?: NavItem[]; menuOnly?: boolean };

// Defaults only: the live menus are edited in Dashboard → Site settings (lib/settings.ts).
export const mainNav: NavItem[] = [
  { label: "Universities", href: "/universities" },
  { label: "Destinations", href: "/destinations" },
  { label: "Test Prep", href: "/test-prep" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Study abroad",
    items: [
      { label: "Universities", href: "/universities" },
      { label: "Destinations", href: "/destinations" },
      { label: "Subjects", href: "/subjects" },
      { label: "Test preparation", href: "/test-prep" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About us", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Get started",
    items: [
      { label: "Free consultation", href: "/consultation" },
      { label: "Become an agent", href: "/become-an-agent" },
      { label: "Our partner universities", href: "/partners" },
    ],
  },
];

// Default contact details, used until they are saved in Dashboard → Site settings.
export const contact = {
  phone: "+44 2033554453",
  email: "info@nrcedu-uk.com",
};
