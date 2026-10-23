"use client";

import { SubmitButton } from "@/components/ui/submit-button";
import { toast } from "@/components/ui/toaster";

// A server action that redirects ends by throwing Next's redirect signal; that is still a success.
const isRedirect = (error: unknown) =>
  typeof error === "object" && error !== null && String((error as { digest?: unknown }).digest ?? "").startsWith("NEXT_REDIRECT");

// Delete with a confirm step, then a toast saying whether it worked.
export function DeleteButton({ action, question }: { action: () => Promise<void>; question: string }) {
  async function run() {
    try {
      await action();
      toast("Deleted");
    } catch (error) {
      // Next already follows the redirect itself; re-throwing would remount the page and lose the toast.
      if (isRedirect(error)) toast("Deleted");
      else toast("Could not delete. Please try again.", "error");
    }
  }

  return (
    <details className="relative">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-full px-4 text-sm font-semibold text-red-700 hover:bg-red-500/10 [&::-webkit-details-marker]:hidden">
        Delete
      </summary>
      <form action={run} className="glass-solid absolute right-0 top-full z-10 mt-1 w-60 rounded-2xl p-3">
        <p className="text-sm">{question}</p>
        <SubmitButton size="sm" pendingText="Deleting…" className="mt-2 bg-red-600 bg-none shadow-none hover:bg-red-700">
          Yes, delete
        </SubmitButton>
      </form>
    </details>
  );
}
