import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

// The login page reads the session cookie to bounce signed-in admins to the
// dashboard, so it blocks on the server rather than prerendering a static shell.
export const instant = false;

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex flex-1 items-center justify-center bg-navy-950 px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(60rem 30rem at 50% 0%, rgba(22,163,74,0.18), transparent 70%)",
        }}
      />
      <div className="relative">
        <LoginForm />
        <p className="mt-5 text-center text-xs text-navy-100/50">
          Authorised staff only. Sessions expire automatically.
        </p>
      </div>
    </div>
  );
}
