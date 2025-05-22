"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, AlertCircle, AlertTriangle, Mail } from "lucide-react";
import { GlowingButton } from "@/components/glowing-button";
import { FuturisticCard } from "@/components/futuristic-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi } from "@/lib/api-client";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const noVerificationEmail = searchParams.get("no_verification") === "true";
  const emailParam = searchParams.get("email");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendingEmail, setResendingEmail] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
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
    getValues,
    watch,
    setValue
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailParam || "",
      password: "",
    },
  });

  // Check for email parameter on load
  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
      checkEmailVerification(emailParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailParam]);

  // Watch the email field for changes
  const watchedEmail = watch("email");
  
  const checkEmailVerification = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      setCheckingEmail(true);
      // First check if email exists
      const existsResponse = await authApi.checkEmailExists(email);
      
      if (existsResponse.success && existsResponse.data?.exists) {
        // Use the dedicated verification check endpoint
        const verificationResponse = await authApi.checkEmailVerification(email);
        
        if (verificationResponse.success) {
          const isVerified = verificationResponse.verified !== false && 
                           verificationResponse.data?.verified !== false;
          
          if (!isVerified) {
            setIsUnverified(true);
            setUnverifiedEmail(email);
            setAuthError("Your email is not verified. Please verify your email before logging in.");
          } else {
            // Email is verified
            setIsUnverified(false);
            setAuthError(null);
          }
        }
      }
    } catch (error) {
      // Silently fail, don't show errors for this preflight check
      console.log("Verification check error:", error);
    } finally {
      setCheckingEmail(false);
    }
  };
  
  // Debounce email verification check
  useEffect(() => {
    if (!watchedEmail || !watchedEmail.includes('@')) return;
    
    const timer = setTimeout(() => {
      checkEmailVerification(watchedEmail);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [watchedEmail]);

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    
    try {
      const response = await login(data.email, data.password);
      
      if (!response.success) {
        // Handle different error types
        if (response.message?.toLowerCase().includes('verify your email') || 
            response.message?.toLowerCase().includes('not verified')) {
          // Make verification status more visible
          setIsUnverified(true);
          setUnverifiedEmail(data.email);
          setAuthError("Your email is not verified. Please verify your email before logging in.");
          
          // Auto-focus verification section
          setTimeout(() => {
            const alertElement = document.querySelector('.bg-amber-50');
            if (alertElement) {
              alertElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } else if (response.message?.includes('Invalid credentials')) {
          setAuthError("Invalid email or password. Please try again.");
        } else {
          setAuthError(response.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      setAuthError("Login failed. Please try again later.");
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    try {
      setResendingEmail(true);
      const response = await authApi.resendVerificationEmail(unverifiedEmail);
      
      if (response.success) {
        if (response.emailSent) {
          toast.success(
            <div className="flex flex-col">
              <span className="font-semibold">Verification email sent!</span>
              <span className="text-sm">Please check your inbox at {unverifiedEmail}</span>
            </div>, 
            { duration: 5000 }
          );
          // Make verification alert more prominent after sending
          const alertElement = document.querySelector('.bg-amber-50');
          if (alertElement) {
            alertElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          toast.error(
            <div className="flex flex-col">
              <span className="font-semibold">Email delivery failed</span>
              <span className="text-sm">Please contact support to verify your account</span>
            </div>,
            { duration: 5000 }
          );
        }
      } else {
        toast.error(response.message || "Failed to resend verification email.");
      }
    } catch (error) {
      toast.error("Failed to resend verification email. Please try again later.");
    } finally {
      setResendingEmail(false);
    }
  };

  // Add a standalone verification button for unverified emails
  const VerificationButton = () => (
    <div className="mt-4">
      <Alert className="bg-amber-50 border-amber-300 mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Your email is not verified. Please verify your email to log in.
        </AlertDescription>
      </Alert>
      
      <button
        onClick={handleResendVerification}
        className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        disabled={resendingEmail}
        type="button"
      >
        <Mail className="mr-2 h-4 w-4" />
        {resendingEmail ? "Sending verification email..." : "Resend verification email"}
      </button>
      
      {resendingEmail && (
        <p className="text-xs text-center mt-2 text-amber-700">
          Sending verification email to {unverifiedEmail}...
        </p>
      )}
    </div>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <FuturisticCard className="w-full max-w-md">
        <div className="space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">Login to your LabShareDAO account</p>
          </div>

          {isRegistered && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {noVerificationEmail 
                  ? "Registration successful! Please contact support to verify your account."
                  : "Registration successful! Please check your email to verify your account before logging in."}
              </AlertDescription>
            </Alert>
          )}

          {authError && !isUnverified && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {/* Show the login error if email verification is needed */}
          {isUnverified && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
                onBlur={(e) => {
                  // Check verification status on blur
                  if (e.target.value && e.target.value.includes('@')) {
                    checkEmailVerification(e.target.value);
                  }
                }}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/90"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Show verification button before the login button if email is unverified */}
            {isUnverified && <VerificationButton />}

            <GlowingButton 
              type="submit" 
              className="w-full" 
              disabled={loading || resendingEmail}
            >
              {loading ? "Logging in..." : 
               isUnverified ? "Verify Email First" : "Log in"}
            </GlowingButton>
          </form>

          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:text-primary/90">
              Sign up
            </Link>
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
} 