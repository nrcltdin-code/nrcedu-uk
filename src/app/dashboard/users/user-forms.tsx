"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { KeepValuesOnError } from "@/components/ui/keep-values-on-error";
import type { Role, UserStatus } from "@/generated/prisma/client";
import { createStaffUser, updateStaffPermissions, updateUserAccess } from "./actions";
import type { UserFormState } from "./actions";
import { permissionModules, roleLabels, statusLabels } from "./labels";

function FormError({ state }: { state: UserFormState }) {
  return (
    <>
      <KeepValuesOnError state={state} failed={Boolean(state.error)} />
      {state.error && (
        <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
          {state.error}
        </p>
      )}
    </>
  );
}

export function NewStaffForm() {
  const [state, action, pending] = useActionState<UserFormState, FormData>(createStaffUser, {});

  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="staff-name">Full name</Label>
        <Input id="staff-name" name="name" maxLength={100} required />
      </div>
      <div>
        <Label htmlFor="staff-email">Email</Label>
        <Input id="staff-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="staff-role">Role</Label>
        <Select id="staff-role" name="role" defaultValue="STAFF">
          <option value="STAFF">Staff / counsellor</option>
          <option value="ADMIN">Administrator</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="staff-password">First password</Label>
        <Input id="staff-password" name="password" type="text" minLength={8} autoComplete="off" required />
        <p className="mt-1.5 text-xs text-muted">Share it with them privately; they can change it once password reset is added.</p>
      </div>
      <FormError state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add account"}
      </Button>
    </form>
  );
}

export function AccessForm({ id, role, status }: { id: string; role: Role; status: UserStatus }) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(updateUserAccess, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="user-role">Role</Label>
          <Select id="user-role" name="role" defaultValue={role}>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="user-status">Status</Label>
          <Select id="user-status" name="status" defaultValue={status}>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted">Anyone not active is signed out straight away and cannot sign in.</p>
      <FormError state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Saving…" : "Save access"}
      </Button>
    </form>
  );
}

export type PermissionLevel = "edit" | "view" | "none";

export function PermissionsForm({ id, levels }: { id: string; levels: Record<string, PermissionLevel> }) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(updateStaffPermissions, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-2">
        {permissionModules.map(({ module, label }) => (
          <div key={module}>
            <Label htmlFor={`perm-${module}`}>{label}</Label>
            <Select id={`perm-${module}`} name={module} defaultValue={levels[module] ?? "none"}>
              <option value="edit">View and edit</option>
              <option value="view">View only</option>
              <option value="none">No access</option>
            </Select>
          </div>
        ))}
      </div>
      <FormError state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Saving…" : "Save module access"}
      </Button>
    </form>
  );
}
