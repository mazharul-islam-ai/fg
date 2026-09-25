import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLayout } from "@/components/layout/PageLayout";
import { toast } from "sonner";

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12)
});

type SignInData = z.infer<typeof SignInSchema>;

export default function SignInPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignInData>({ resolver: zodResolver(SignInSchema) });

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from?.pathname || "/";

  async function onSubmit(values: SignInData) {
    try {
      // Optional: call precheck edge function to enforce lockout rules
      await fetch("/functions/v1/auth-security-precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email })
      }).catch(() => null);

      const res = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (res.error) {
        // Log failed login event
        await fetch("/functions/v1/audit-log-writer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "failed_sign_in", metadata: { email: values.email, error: res.error.message } })
        }).catch(() => null);

        toast.error(res.error.message);
        return;
      }

      toast.success("Signed in");
      navigate(redirectTo);
    } catch (err: any) {
      toast.error(err?.message || "Sign in failed");
    }
  }

  return (
    <PageLayout>
      <PageLayout.Content>
        <div className="max-w-md mx-auto mt-16 p-6 bg-card rounded-lg shadow-soft">
          <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <a className="text-sm text-primary" href="/auth/forgot">Forgot password?</a>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</Button>
            </div>
          </form>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
