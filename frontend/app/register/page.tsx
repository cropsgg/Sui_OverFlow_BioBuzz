"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { GlowingButton } from "@/components/glowing-button";
import { FuturisticCard } from "@/components/futuristic-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api-client";
import { debounce } from "@/lib/utils";
import { useRouter } from "next/navigation";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { user, register: registerUser, loading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'checking' | 'exists' | 'available' | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'exists' | 'available' | null>(null);
  
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
    watch,
    setValue,
    getValues
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchEmail = watch("email");
  const watchUsername = watch("username");
  
  // Check if email exists using debounce
  useEffect(() => {
    const checkEmail = debounce(async (email: string) => {
      if (!email || !z.string().email().safeParse(email).success) return;
      
      setEmailStatus('checking');
      try {
        const response = await authApi.checkEmailExists(email);
        if (response.success) {
          setEmailStatus(response.data?.exists ? 'exists' : 'available');
        }
      } catch (error) {
        console.error('Failed to check email:', error);
        setEmailStatus(null);
      }
    }, 500);
    
    if (watchEmail) {
      checkEmail(watchEmail);
    } else {
      setEmailStatus(null);
    }
    
    return () => checkEmail.cancel();
  }, [watchEmail]);
  
  // Check if username exists using debounce
  useEffect(() => {
    const checkUsername = debounce(async (username: string) => {
      if (!username || username.length < 3) return;
      
      setUsernameStatus('checking');
      try {
        const response = await authApi.checkUsernameExists(username);
        if (response.success) {
          setUsernameStatus(response.data?.exists ? 'exists' : 'available');
        }
      } catch (error) {
        console.error('Failed to check username:', error);
        setUsernameStatus(null);
      }
    }, 500);
    
    if (watchUsername) {
      checkUsername(watchUsername);
    } else {
      setUsernameStatus(null);
    }
    
    return () => checkUsername.cancel();
  }, [watchUsername]);

  const onSubmit = async (data: RegisterFormValues) => {
    // Check for duplicate email or username before submitting
    if (emailStatus === 'exists' || usernameStatus === 'exists') {
      return;
    }
    
    const { confirmPassword, ...userData } = data;
    await registerUser(userData);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <FuturisticCard className="w-full max-w-md">
        <div className="space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="text-muted-foreground">Sign up for LabShareDAO platform</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
              <Label htmlFor="username">Username</Label>
                {usernameStatus && (
                  <div className="flex items-center space-x-1 text-xs">
                    {usernameStatus === 'checking' && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Checking...</span>
                      </>
                    )}
                    {usernameStatus === 'exists' && (
                      <>
                        <XCircle className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">Already taken</span>
                      </>
                    )}
                    {usernameStatus === 'available' && (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">Available</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <Input
                id="username"
                placeholder="username"
                {...register("username")}
                className={
                  errors.username 
                    ? "border-destructive" 
                    : usernameStatus === 'exists'
                    ? "border-destructive"
                    : usernameStatus === 'available'
                    ? "border-green-500"
                    : ""
                }
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
              {usernameStatus === 'exists' && !errors.username && (
                <p className="text-sm text-destructive">Username already taken. Please choose another one.</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
              <Label htmlFor="email">Email</Label>
                {emailStatus && (
                  <div className="flex items-center space-x-1 text-xs">
                    {emailStatus === 'checking' && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Checking...</span>
                      </>
                    )}
                    {emailStatus === 'exists' && (
                      <>
                        <XCircle className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">Already registered</span>
                      </>
                    )}
                    {emailStatus === 'available' && (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">Available</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <Input
                id="email"
                placeholder="name@example.com"
                {...register("email")}
                className={
                  errors.email 
                    ? "border-destructive" 
                    : emailStatus === 'exists'
                    ? "border-destructive"
                    : emailStatus === 'available'
                    ? "border-green-500"
                    : ""
                }
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
              {emailStatus === 'exists' && !errors.email && (
                <div className="text-sm">
                  <p className="text-destructive">Email already registered.</p>
                  <Link href="/login" className="text-primary hover:text-primary/90">
                    Log in instead
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <GlowingButton 
              type="submit" 
              className="w-full" 
              disabled={loading || emailStatus === 'exists' || usernameStatus === 'exists' || emailStatus === 'checking' || usernameStatus === 'checking'}
            >
              {loading ? "Creating account..." : "Create account"}
            </GlowingButton>
          </form>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary/90">
              Log in
            </Link>
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
} 