import "server-only";
import { db } from "@/lib/db";
import { link } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";
import type { CurrentUser } from "@/lib/session";

// Everything the "Send email" button needs from the server.
export async function composeProps(user: CurrentUser) {
  const [templates, settings] = await Promise.all([
    db.emailTemplate.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, subject: true, body: true },
    }),
    getSiteSettings(),
  ]);
  return { templates, myName: user.name, portalLink: link("/?auth=login&next=/dashboard"), reviewLink: settings.contact.reviewLink };
}
