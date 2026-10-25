// Wipes every person and all test activity before the site is handed to NRC.
// Keeps website content (universities, courses, blog, slides, testimonials, partners, FAQs,
// test-prep pages, offices, countries, subjects), site settings, email templates and uploaded images.
//
//   npm run db:reset-handover              shows what would be deleted, changes nothing
//   npm run db:reset-handover -- --confirm deletes it, then removes private files from storage
//
// Afterwards create NRC's admin with `npm run db:seed` (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
import "dotenv/config";
import { db } from "../src/lib/db";
import { deletePrivateObject, listPrivateObjects, privateStorageEnabled } from "../src/lib/storage";

const confirm = process.argv.includes("--confirm");

// Children before parents, so nothing is blocked by a foreign key.
const tables = [
  ["Notifications", () => db.notification.deleteMany()],
  ["Reminders", () => db.reminder.deleteMany()],
  ["Messages", () => db.message.deleteMany()],
  ["Notes", () => db.note.deleteMany()],
  ["Commissions", () => db.commission.deleteMany()],
  ["Offer conditions", () => db.applicationCondition.deleteMany()],
  ["Application history", () => db.applicationEvent.deleteMany()],
  ["Documents", () => db.document.deleteMany()],
  ["Document requests", () => db.documentRequest.deleteMany()],
  ["Applications", () => db.application.deleteMany()],
  ["Education records", () => db.educationRecord.deleteMany()],
  ["Test scores", () => db.testScore.deleteMany()],
  ["Leads", () => db.lead.deleteMany()],
  ["Country routing", () => db.countryAssignment.deleteMany()],
  ["Agent documents", () => db.agentDocument.deleteMany()],
  ["Agent document requests", () => db.agentDocumentRequest.deleteMany()],
  ["Students", () => db.studentProfile.deleteMany()],
  ["Agents", () => db.agentProfile.deleteMany()],
  ["Activity log", () => db.activityLog.deleteMany()],
  ["Email log", () => db.emailLog.deleteMany()],
  ["Page views", () => db.pageView.deleteMany()],
  ["Rate limit counts", () => db.rateLimit.deleteMany()],
  ["Verification links", () => db.verification.deleteMany()],
  ["Two-step set-ups", () => db.twoFactor.deleteMany()],
  ["Sessions", () => db.session.deleteMany()],
  ["Sign-in accounts", () => db.account.deleteMany()],
  ["Staff permissions", () => db.staffPermission.deleteMany()],
  ["Users", () => db.user.deleteMany()],
] as const;

const counts = {
  Notifications: () => db.notification.count(),
  Reminders: () => db.reminder.count(),
  Messages: () => db.message.count(),
  Notes: () => db.note.count(),
  Commissions: () => db.commission.count(),
  "Offer conditions": () => db.applicationCondition.count(),
  "Application history": () => db.applicationEvent.count(),
  Documents: () => db.document.count(),
  "Document requests": () => db.documentRequest.count(),
  Applications: () => db.application.count(),
  "Education records": () => db.educationRecord.count(),
  "Test scores": () => db.testScore.count(),
  Leads: () => db.lead.count(),
  "Country routing": () => db.countryAssignment.count(),
  "Agent documents": () => db.agentDocument.count(),
  "Agent document requests": () => db.agentDocumentRequest.count(),
  Students: () => db.studentProfile.count(),
  Agents: () => db.agentProfile.count(),
  "Activity log": () => db.activityLog.count(),
  "Email log": () => db.emailLog.count(),
  "Page views": () => db.pageView.count(),
  "Rate limit counts": () => db.rateLimit.count(),
  "Verification links": () => db.verification.count(),
  "Two-step set-ups": () => db.twoFactor.count(),
  Sessions: () => db.session.count(),
  "Sign-in accounts": () => db.account.count(),
  "Staff permissions": () => db.staffPermission.count(),
  Users: () => db.user.count(),
} as Record<string, () => Promise<number>>;

async function main() {
  for (const [name] of tables) console.log(`${name.padEnd(26)} ${await counts[name]()}`);

  if (!confirm) {
    console.log("\nNothing deleted. Run again with --confirm to delete the rows above and all private files.");
    return;
  }

  await db.$transaction(tables.map(([, remove]) => remove()));
  console.log("\nDatabase rows deleted.");

  // Student and agent files live in the private bucket; with their rows gone they are orphans.
  if (!privateStorageEnabled) {
    console.log("Private storage is not configured here; delete documents/ and agent-documents/ in R2 by hand.");
    return;
  }
  let files = 0;
  for (const prefix of ["documents/", "agent-documents/"]) {
    for await (const { key } of listPrivateObjects(prefix)) {
      await deletePrivateObject(key);
      files++;
    }
  }
  console.log(`Private files deleted: ${files}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
