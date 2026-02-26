import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/app") ? next : "/app";

  async function loginAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return;
    }

    (await cookies()).set("auth_token", "demo-session", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect(nextPath);
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md items-center px-4">
      <div className="w-full rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access your workspace and continue where you left off.
        </p>

        <form action={loginAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
