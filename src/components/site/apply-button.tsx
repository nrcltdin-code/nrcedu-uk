import { Suspense } from "react";
import Link from "next/link";
import { AuthTrigger } from "@/components/auth/auth-drawer";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

type Size = "sm" | "md" | "lg";

// The application form lives in the dashboard (task 4.2) and opens with this course selected.
const applyHref = (courseId: string) => `/dashboard/apply?course=${courseId}`;

// "Apply" for one course. Signed-in visitors go straight to the application form; everyone
// else gets the sign-up panel first and lands on the form afterwards.
export function ApplyButton({ courseId, size = "sm", label = "Apply" }: { courseId: string; size?: Size; label?: string }) {
  const guest = (
    <AuthTrigger mode="register" next={applyHref(courseId)} className={buttonStyles({ variant: "accent", size })}>
      {label}
    </AuthTrigger>
  );

  return (
    <Suspense fallback={guest}>
      <ApplyLink courseId={courseId} size={size} label={label} guest={guest} />
    </Suspense>
  );
}

async function ApplyLink({ courseId, size, label, guest }: { courseId: string; size: Size; label: string; guest: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return guest;

  return (
    <Link href={applyHref(courseId)} className={buttonStyles({ variant: "accent", size })}>
      {label}
    </Link>
  );
}
