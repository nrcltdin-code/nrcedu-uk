import "server-only";
import { db } from "@/lib/db";
import { link } from "@/lib/email";
import type { CurrentUser } from "@/lib/session";

// Everything the "Send email" button needs from the server.
export async function composeProps(user: CurrentUser) {
  const templates = await db.emailTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, subject: true, body: true },
  });
  return { templates, myName: user.name, portalLink: link("/?auth=login&next=/dashboard") };
}
