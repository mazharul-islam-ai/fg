import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLayout } from "@/components/layout/PageLayout";
import { toast } from "sonner";

const Schema = z.object({ email: z.string().email() });
type Form = z.infer<typeof Schema>;

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<Form>({
    resolver: zodResolver(Schema)
  });

  async function onSubmit(values: Form) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) throw error;
      toast.success("Password reset email sent (check your inbox).");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset email");
    }
  }

  return (
    <PageLayout>
      <PageLayout.Content>
        <div className="max-w-md mx-auto mt-16 p-6 bg-card rounded-lg shadow-soft">
          <h1 className="text-2xl font-semibold mb-4">Forgot password</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send reset email"}</Button>
            </div>
          </form>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
