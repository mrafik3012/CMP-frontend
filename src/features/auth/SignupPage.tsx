/**
 * Signup: Phone mandatory, email optional. No password; verify with mobile OTP.
 * Step 1: Name, Phone (with country code), Email (optional), Role → Register (OTP sent)
 * Step 2: Enter 6-digit OTP → Verify & Activate → Log in
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AxiosError } from "axios";
import { api } from "../../api/client";
import { authApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import { Logo } from "../../components/common/Logo";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { Input } from "../../components/common/Input";
import { IconMail, IconUser } from "../../components/icons";
import { PageTitle } from "../../components/common/PageTitle";
import { useToast } from "../../components/common/Toast";

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+86", label: "China (+86)" },
];

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  countryCode: z.string().min(1, "Select country"),
  phone: z.string().min(8, "Enter a valid phone number").regex(/^[0-9\s-]+$/, "Digits only"),
  email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  role: z.enum(
    ["contractor", "homeowner", "architect", "subcontractor", "project_manager", "consultant"],
    { errorMap: () => ({ message: "Please select your role" }) }
  ),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Enter 6-digit code").regex(/^[0-9]+$/, "Digits only"),
});

type SignupFormData = z.infer<typeof signupSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

function fullPhone(countryCode: string, number: string): string {
  return countryCode + number.replace(/\D/g, "");
}

export function SignupPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [phoneSent, setPhoneSent] = useState("");
  const [formError, setFormError] = useState("");
  const { error: toastError } = useToast();

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { countryCode: "+91", phone: "", email: "", name: "", role: undefined },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onSubmitSignup = async (data: SignupFormData) => {
    setFormError("");
    try {
      const phone = fullPhone(data.countryCode, data.phone);
      await api.post("/auth/register", {
        name: data.name,
        phone,
        email: data.email?.trim() || undefined,
        role: data.role,
      });
      setPhoneSent(phone);
      setStep("otp");
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      if (err.response?.status === 409) {
        const detail = String(err.response?.data?.detail ?? "").toLowerCase();
        if (detail.includes("phone")) setFormError("This phone number is already registered.");
        else setFormError("This email is already registered.");
      } else {
        setFormError("Registration failed. Please try again.");
      }
      toastError("Signup failed");
    }
  };

  const onVerifyOtp = async (data: OtpFormData) => {
    setFormError("");
    try {
      await authApi.verifySignupOtp(phoneSent, data.otp);
      const { data: user } = await authApi.me();
      if (user) setUser(user);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setFormError("Invalid or expired OTP. Please sign up again to get a new code.");
      toastError("Verification failed");
    }
  };

  return (
    <>
      <PageTitle title="Create Account" />
      <div className="flex min-h-screen items-center justify-center bg-surface-card px-4">
        <div className="w-full max-w-[420px]">
          <Logo size="md" className="mb-8" />
          <h1 className="text-3xl font-bold text-text-primary">Create account</h1>
          <p className="mt-2 mb-6 text-sm text-text-secondary">
            Start your free 3-month trial. No credit card required. Sign in with your phone.
          </p>

          {formError && (
            <div className="mb-4 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-status-danger animate-shake">
              {formError}
            </div>
          )}

          {step === "form" && (
            <form onSubmit={signupForm.handleSubmit(onSubmitSignup)} className="space-y-3" noValidate>
              <FormField label="Full Name" required error={signupForm.formState.errors.name?.message}>
                <Input
                  leftIcon={<IconUser className="h-4 w-4" />}
                  type="text"
                  autoComplete="name"
                  data-testid="name-input"
                  error={!!signupForm.formState.errors.name}
                  {...signupForm.register("name")}
                />
              </FormField>

              <FormField label="Phone number" required error={signupForm.formState.errors.phone?.message}>
                <div className="flex gap-2">
                  <select
                    className="h-10 w-24 shrink-0 rounded-md border border-surface-border bg-surface-base px-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                    {...signupForm.register("countryCode")}
                  >
                    {COUNTRY_CODES.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <Input
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    data-testid="phone-input"
                    error={!!signupForm.formState.errors.phone}
                    className="flex-1"
                    {...signupForm.register("phone")}
                  />
                </div>
              </FormField>

              <FormField label="Email (optional)" error={signupForm.formState.errors.email?.message}>
                <Input
                  leftIcon={<IconMail className="h-4 w-4" />}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  data-testid="email-input"
                  error={!!signupForm.formState.errors.email}
                  {...signupForm.register("email")}
                />
              </FormField>

              <FormField label="I am a..." required error={signupForm.formState.errors.role?.message}>
                <select
                  className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  {...signupForm.register("role")}
                  defaultValue=""
                >
                  <option value="">Select Role</option>
                  <option value="contractor">Contractor</option>
                  <option value="homeowner">Home Owner</option>
                  <option value="architect">Architect/Designer</option>
                  <option value="subcontractor">Subcontractor</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="consultant">Consultant</option>
                </select>
              </FormField>

              <Button
                variant="primary"
                size="lg"
                isLoading={signupForm.formState.isSubmitting}
                type="submit"
                className="mt-4 flex h-12 w-full items-center justify-center"
                disabled={signupForm.formState.isSubmitting}
              >
                Send verification code
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-3" noValidate>
              <p className="text-sm text-text-secondary">
                We sent a 6-digit code to <strong>{phoneSent}</strong>. Enter it below.
              </p>
              <FormField label="6-digit code" required error={otpForm.formState.errors.otp?.message}>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  data-testid="otp-input"
                  error={!!otpForm.formState.errors.otp}
                  {...otpForm.register("otp")}
                />
              </FormField>
              <Button
                variant="primary"
                size="lg"
                isLoading={otpForm.formState.isSubmitting}
                type="submit"
                className="mt-6 flex h-12 w-full items-center justify-center"
                data-testid="verify-otp-btn"
                disabled={otpForm.formState.isSubmitting}
              >
                Verify & Create account
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-brand-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
