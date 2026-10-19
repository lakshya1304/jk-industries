"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { changePasswordSchema } from "@/lib/validation";

export function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setError(null);
    setStatus("idle");

    const parsed = changePasswordSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setStatus("saving");
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not update your password.");
        setStatus("idle");
        return;
      }
      setStatus("saved");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setError("A network error occurred. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
      <div>
        <h2 className="text-base font-extrabold text-navy-900">Change password</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Use at least 8 characters. Update this before sharing access with your team.
        </p>
      </div>

      <Field label="Current password" htmlFor="currentPassword" required error={errors.currentPassword}>
        <Input id="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set("currentPassword")} invalid={Boolean(errors.currentPassword)} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="New password" htmlFor="newPassword" required error={errors.newPassword}>
          <Input id="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={set("newPassword")} invalid={Boolean(errors.newPassword)} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" required error={errors.confirmPassword}>
          <Input id="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} invalid={Boolean(errors.confirmPassword)} />
        </Field>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={status === "saving"}>
          {status === "saving" ? "Updating…" : "Update password"}
        </Button>
        {status === "saved" && <span className="text-sm font-semibold text-fresh-700">Password updated ✓</span>}
      </div>
    </form>
  );
}
