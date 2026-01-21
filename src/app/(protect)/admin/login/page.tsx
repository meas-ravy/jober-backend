import type { Metadata } from "next";

import { LoginForm } from "@/src/components/login-form";

export const metadata: Metadata = {
  title: "Login - Jober",
  description: "Sign in to the Jober admin dashboard.",
};

export default async function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
