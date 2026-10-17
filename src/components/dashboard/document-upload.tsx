"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";

type Props = {
  studentId: string;
  // Upload into one document request: its type and application come from the request.
  requestId?: string;
  types?: { value: string; label: string }[];
  applications?: { id: string; name: string }[];
  enabled: boolean;
};

const MAX_BYTES = 10 * 1024 * 1024;
const accepted = ["application/pdf", "image/jpeg", "image/png"];

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

// Three steps: ask the server for an upload link, send the file straight to storage, then ask
// the server to check it. The server repeats every check; the ones here only save a wasted upload.
export function DocumentUpload({ studentId, requestId, types = [], applications = [], enabled }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ busy?: string; error?: string; done?: string }>({});

  async function upload(form: FormData) {
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus({ error: "Choose a file." });
    if (!accepted.includes(file.type)) return setStatus({ error: "Only PDF, JPG or PNG files can be uploaded." });
    if (file.size > MAX_BYTES) return setStatus({ error: "The file is too large. The limit is 10 MB." });

    try {
      setStatus({ busy: "Preparing…" });
      const { uploadUrl, ticket } = await post("/api/documents/start", {
        studentId,
        requestId: requestId ?? null,
        applicationId: form.get("applicationId") || null,
        type: form.get("type"),
        name: file.name,
        size: file.size,
      });

      setStatus({ busy: "Uploading…" });
      const put = await fetch(uploadUrl, { method: "PUT", body: file });
      if (!put.ok) throw new Error("The upload did not go through. Please try again.");

      setStatus({ busy: "Checking the file…" });
      await post("/api/documents/finish", { ticket });

      if (fileRef.current) fileRef.current.value = "";
      setStatus({ done: `${file.name} uploaded.` });
      router.refresh();
    } catch (error) {
      setStatus({ error: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    }
  }

  if (!enabled) {
    return <p className="text-sm text-muted">Document uploads are not set up yet. They switch on when file storage is connected.</p>;
  }

  return (
    <form action={upload} className="grid gap-3">
      {!requestId && <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`d-type-${studentId}`}>Document</Label>
          <Select id={`d-type-${studentId}`} name="type" defaultValue="" required>
            <option value="" disabled>Choose…</option>
            {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        {applications.length > 0 && (
          <div>
            <Label htmlFor={`d-app-${studentId}`}>For application</Label>
            <Select id={`d-app-${studentId}`} name="applicationId" defaultValue="">
              <option value="">General</option>
              {applications.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </div>
        )}
      </div>}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        required
        aria-label="File"
        className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-600/10 file:px-4 file:py-2 file:font-semibold file:text-brand-800"
      />
      <p className="text-xs text-muted">PDF, JPG or PNG, up to 10 MB.</p>
      {status.error && <p role="alert" className="text-sm text-red-700">{status.error}</p>}
      {status.done && <p role="status" className="text-sm text-emerald-700">{status.done}</p>}
      <Button type="submit" size="sm" disabled={Boolean(status.busy)} className="justify-self-start">{status.busy ?? "Upload"}</Button>
    </form>
  );
}
