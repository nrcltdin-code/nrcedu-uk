import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Opening a notification marks it read and goes to the page it points at.
// Only the owner's notices, and only paths inside this site.
export async function GET(request: Request, { params }: RouteContext<"/dashboard/notifications/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.redirect(new URL("/?auth=login", request.url), 303);
  const { id } = await params;

  const notification = await db.notification.findFirst({ where: { id, userId: user.id }, select: { href: true, readAt: true } });
  if (notification && !notification.readAt) {
    await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
  const href = notification?.href;
  const target = href && href.startsWith("/") && !href.startsWith("//") ? href : "/dashboard/notifications";
  return Response.redirect(new URL(target, request.url), 303);
}
