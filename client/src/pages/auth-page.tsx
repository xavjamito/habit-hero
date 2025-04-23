import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Register schema
const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(1, "Name is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [isLoginView, setIsLoginView] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Direct state for form values
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  // Validation errors
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>(
    {}
  );

  // Switch view handler - clear errors and reset the other form
  const handleSwitchView = (toLogin: boolean) => {
    if (toLogin) {
      setRegisterErrors({});
      setRegisterEmail("");
      setRegisterName("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } else {
      setLoginErrors({});
      // Don't clear login fields to allow easy signup with same credentials
    }
    setIsLoginView(toLogin);
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Login form submit handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const result = loginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path[0].toString();
        formattedErrors[path] = error.message;
      });
      setLoginErrors(formattedErrors);
      return;
    }

    // Clear errors and submit
    setLoginErrors({});
    loginMutation.mutate({
      email: loginEmail,
      password: loginPassword,
    });
  };

  // Registration form submit handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const result = registerSchema.safeParse({
      email: registerEmail,
      name: registerName,
      password: registerPassword,
      confirmPassword: registerConfirmPassword,
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path[0].toString();
        formattedErrors[path] = error.message;
      });
      setRegisterErrors(formattedErrors);
      return;
    }

    // Clear errors and submit
    setRegisterErrors({});

    // Log registration data
    console.log("Registration data:", {
      email: registerEmail,
      name: registerName,
      password: registerPassword,
    });

    registerMutation.mutate({
      email: registerEmail,
      name: registerName,
      password: registerPassword,
    });
  };

  return (
    <div className='min-h-screen bg-background flex justify-center items-center p-4'>
      <div className='w-full max-w-md'>
        {/* 3D illustration */}
        <div className='mb-8 flex justify-center'>
          <img
            src='/assets/3d-workspace.svg'
            alt='Productivity illustration'
            className='w-44 h-44'
          />
        </div>

        {/* Title */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold mb-1'>
            The only productivity app you need
          </h1>
          <p className='text-muted-foreground'>
            Track your tasks, build habits, and achieve your goals
          </p>
        </div>

        {/* Login Form */}
        {isLoginView ? (
          <div>
            <form onSubmit={handleLoginSubmit} className='space-y-4'>
              <div>
                <Input
                  type='email'
                  placeholder='Email'
                  className='bg-secondary border-0 h-12 placeholder:text-muted-foreground'
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                {loginErrors.email && (
                  <p className='text-sm font-medium text-destructive mt-1'>
                    {loginErrors.email}
                  </p>
                )}
              </div>

              <div>
                <Input
                  type='password'
                  placeholder='Password'
                  className='bg-secondary border-0 h-12 placeholder:text-muted-foreground'
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                {loginErrors.password && (
                  <p className='text-sm font-medium text-destructive mt-1'>
                    {loginErrors.password}
                  </p>
                )}
              </div>

              <Button
                type='submit'
                className='w-full h-12 bg-primary btn-glow rounded-full'
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Signing in...
                  </>
                ) : (
                  "Sign in with Email"
                )}
              </Button>
            </form>

            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-border'></div>
              </div>
              <div className='relative flex justify-center text-xs'>
                <span className='bg-background px-2 text-muted-foreground'>
                  Or continue with
                </span>
              </div>
            </div>

            <div className='flex gap-4'>
              <Button
                variant='outline'
                className='w-full h-12 bg-secondary/50 border-0'
              >
                Google
              </Button>
              <Button
                variant='outline'
                className='w-full h-12 bg-secondary/50 border-0'
              >
                Apple ID
              </Button>
            </div>

            <div className='text-center mt-6 text-sm text-muted-foreground'>
              By continuing you agree to the Terms and Conditions
            </div>
          </div>
        ) : (
          <div>
            <form onSubmit={handleRegisterSubmit} className='space-y-4'>
              <div>
                <Input
                  type='email'
                  placeholder='Email address'
                  className='bg-secondary border-0 h-12 placeholder:text-muted-foreground'
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                />
                {registerErrors.email && (
                  <p className='text-sm font-medium text-destructive mt-1'>
                    {registerErrors.email}
                  </p>
                )}
              </div>

              <div>
                <Input
                  placeholder='Full Name'
                  className='bg-secondary border-0 h-12 placeholder:text-muted-foreground'
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
                {registerErrors.name && (
                  <p className='text-sm font-medium text-destructive mt-1'>
                    {registerErrors.name}
                  </p>
                )}
              </div>

              <div>
                <Input
                  type='password'
                  placeholder='Password'
                  className='bg-secondary border-0 h-12 placeholder:text-muted-foreground'
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
                {registerErrors.password && (
                  <p className='text-sm font-medium text-destructive mt-1'>
                    {registerErrors.password}
                  </p>
                )}
              </div>

              <div>
                <Input
                  type='password'
                  placeholder='Confirm Password'
                  className='bg-secondary border-0 h-12 placeholder:text-muted-foreground'
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                />
                {registerErrors.confirmPassword && (
                  <p className='text-sm font-medium text-destructive mt-1'>
                    {registerErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type='submit'
                className='w-full h-12 bg-primary btn-glow rounded-full'
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating account...
                  </>
                ) : (
                  "Sign up with Email"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Toggle between login and register */}
        <div className='mt-6 text-center'>
          <Button
            variant='link'
            className='text-primary'
            onClick={() => handleSwitchView(!isLoginView)}
          >
            {isLoginView
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
