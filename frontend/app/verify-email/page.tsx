"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { FuturisticCard } from "@/components/futuristic-card";
import { GlowingButton } from "@/components/glowing-button";
import { authApi } from "@/lib/api-client";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }
      
      try {
        const response = await authApi.verifyEmail(token);

        if (response.success) {
          setStatus("success");
          setMessage(response.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(response.message || "Failed to verify email. The link may be invalid or expired.");
        }
      } catch (error) {
        console.error("Email verification failed:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleRequestNewLink = async () => {
    // Implement this functionality if needed
    toast.info("Please contact support or register again if your verification link has expired.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <FuturisticCard className="w-full max-w-md">
        <div className="space-y-6 p-6 text-center">
          <h1 className="text-3xl font-bold">Email Verification</h1>

          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            {status === "loading" && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p>Verifying your email...</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <p>{message}</p>
                <GlowingButton onClick={handleGoToLogin} className="mt-4">
                  Go to Login
                </GlowingButton>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-16 w-16 text-destructive" />
                <p>{message}</p>
                <div className="flex flex-col space-y-2">
                  <GlowingButton onClick={handleGoToLogin} variant="outline" className="mt-4">
                    Go to Login
                  </GlowingButton>
                  <button 
                    onClick={handleRequestNewLink}
                    className="text-sm text-primary hover:text-primary/90"
                  >
                    Request a new verification link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
} 