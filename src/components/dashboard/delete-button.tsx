"use client";

import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { toast } from "@/components/ui/toaster";

// A server action that redirects ends by throwing Next's redirect signal, whose digest is
// "NEXT_REDIRECT;<replace|push>;<url>;<status>;". Returns the url, or null for any other error.
function redirectUrl(error: unknown) {
  const digest = String((error as { digest?: unknown } | null)?.digest ?? "");
  if (!digest.startsWith("NEXT_REDIRECT;")) return null;
  return digest.split(";").slice(2, -2).join(";") || null;
}

// Delete with a confirm step, then a toast saying whether it worked. The redirect is followed
// here (not re-thrown) so the toast survives, and the page is refreshed so the item and any
// open edit panel disappear straight away.
export function DeleteButton({ action, question }: { action: () => Promise<void>; question: string }) {
  const router = useRouter();

  async function run() {
    try {
      await action();
    } catch (error) {
      const url = redirectUrl(error);
      if (!url) {
        toast("Could not delete. Please try again.", "error");
        return;
      }
      toast("Deleted");
      router.replace(url);
      router.refresh();
      return;
    }
    toast("Deleted");
    router.refresh();
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
