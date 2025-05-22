"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { GlowingButton } from "@/components/glowing-button";
import { FuturisticCard } from "@/components/futuristic-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    
    try {
      const response = await authApi.forgotPassword(data.email);

      if (response.success) {
        setIsSubmitted(true);
      } else {
        toast.error(response.message || "Failed to send password reset email");
      }
    } catch (error) {
      console.error("Reset password request failed:", error);
      toast.error("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <FuturisticCard className="w-full max-w-md">
        <div className="space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Forgot Password</h1>
            <p className="text-muted-foreground">
              Enter your email address to receive a password reset link
            </p>
          </div>

          {isSubmitted ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If an account with that email exists, we've sent a password reset link. 
                Please check your inbox and follow the instructions.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <GlowingButton 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </GlowingButton>
            </form>
          )}

          <div className="text-center text-sm">
            <Link href="/login" className="text-primary hover:text-primary/90">
              Back to login
            </Link>
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
} 