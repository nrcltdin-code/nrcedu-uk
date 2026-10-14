import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type Row = { id: string };

// Swaps a row with its neighbour in an ordered list, then renumbers so positions stay 0, 1, 2…
// `rows` must already be sorted the way the list is shown.
export async function moveRow(
  rows: Row[],
  id: string,
  direction: "up" | "down",
  setOrder: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
) {
  const from = rows.findIndex((row) => row.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= rows.length) return;

  const ordered = [...rows];
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
  await db.$transaction(ordered.map((row, index) => setOrder(row.id, index)));
}
