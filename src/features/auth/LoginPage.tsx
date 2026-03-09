/**
 * Login: Mobile OTP flow. FR-AUTH-001.
 * Step 1: Enter phone (country code + number) → Send OTP
 * Step 2: Enter 6-digit OTP, Remember Me → Verify & Login (JWT, 7-day if Remember Me)
 */
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AxiosError } from "axios";
import { authApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import { Logo } from "../../components/common/Logo";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { Input } from "../../components/common/Input";
import { PageTitle } from "../../components/common/PageTitle";
import { useToast } from "../../components/common/Toast";
import { brand } from "../../config/brand";

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

const phoneSchema = z.object({
  countryCode: z.string().min(1, "Select country"),
  number: z.string().min(8, "Enter a valid phone number").regex(/^[0-9\s-]+$/, "Digits only"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Enter 6-digit code").regex(/^[0-9]+$/, "Digits only"),
  rememberMe: z.boolean().optional().default(true),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

function fullPhone(countryCode: string, number: string): string {
  const digits = number.replace(/\D/g, "");
  return countryCode + digits;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneSent, setPhoneSent] = useState("");
  const [formError, setFormError] = useState("");
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const { error: toastError } = useToast();

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { countryCode: "+91", number: "" },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "", rememberMe: true },
  });

  const onSendOtp = async (data: PhoneFormData) => {
    setFormError("");
    setSendOtpLoading(true);
    try {
      const phone = fullPhone(data.countryCode, data.number);
      await authApi.sendLoginOtp(phone);
      setPhoneSent(phone);
      setStep("otp");
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      const status = err.response?.status;
      if (status === 400 || err.response?.data?.detail === "phone_not_found") {
        setFormError("This phone number is not registered. Sign up first.");
      } else if (status === 404 || err.code === "ERR_NETWORK") {
        setFormError("Cannot reach the backend. Start it first (see steps below).");
      } else {
        setFormError(err.response?.data?.detail || "Failed to send OTP. Try again.");
      }
      toastError("Send OTP failed");
    } finally {
      setSendOtpLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpFormData) => {
    setFormError("");
    try {
      await authApi.verifyLoginOtp(phoneSent, data.otp, data.rememberMe ?? false);
      const { data: user } = await authApi.me();
      if (user) setUser(user);
      const state = location.state as { from?: { pathname: string } } | null;
      const redirectTo = state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setFormError("Invalid or expired OTP. Request a new code.");
      toastError("Login failed");
    }
  };

  const backToPhone = () => {
    setStep("phone");
    setFormError("");
    otpForm.reset();
  };

  return (
    <>
      <PageTitle title="Login" />
      <div className="flex min-h-screen bg-surface-base text-text-primary">
        <div className="hidden w-2/5 flex-col items-center justify-center bg-gradient-to-br from-surface-base to-[#0F0F1A] p-12 md:flex">
          <Logo size="lg" />
          <p className="mt-4 text-lg text-text-secondary">{brand.tagline}</p>
          <div className="mt-12 space-y-4 text-sm text-text-secondary">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-status-success/10 text-xs text-status-success">✓</span>
              <span>Real-time project tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-status-success/10 text-xs text-status-success">✓</span>
              <span>Budget monitoring and alerts</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-status-success/10 text-xs text-status-success">✓</span>
              <span>Field-to-office in one platform</span>
            </div>
          </div>
          <p className="mt-auto text-xs text-text-muted">Trusted by construction teams</p>
        </div>

        <div className="flex flex-1 items-center justify-center bg-surface-card px-4">
          <div className="w-full max-w-[400px] px-2">
            <Logo size="md" className="mb-8 md:hidden" />
            <h1 className="text-3xl font-bold text-text-primary">Welcome back</h1>
            <p className="mt-2 mb-8 text-sm text-text-secondary">
              {step === "phone" ? "Sign in with your phone number" : "Enter the 6-digit code sent to your phone"}
            </p>

            {formError && (
              <>
                <div className="mb-4 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-status-danger animate-shake">
                  {formError}
                </div>
                {formError.includes("Cannot reach the backend") && (
                  <div className="mb-4 rounded-lg border border-border-default bg-surface-base p-4 text-sm text-text-secondary space-y-2">
                    <p className="font-medium text-text-primary">Start the backend:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Open a terminal in the project folder.</li>
                      <li>Run: <code className="rounded bg-surface-hover px-1 py-0.5">cd backend</code></li>
                      <li>Run: <code className="rounded bg-surface-hover px-1 py-0.5">uvicorn app.main:app --reload --port 8000</code></li>
                      <li>Wait until you see <code className="rounded bg-surface-hover px-1 py-0.5">Uvicorn running on http://127.0.0.1:8000</code>.</li>
                      <li>In your browser, open <a href="http://localhost:8000/health" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">http://localhost:8000/health</a> — you should see <code className="rounded bg-surface-hover px-1 py-0.5">{"{ \"status\": \"ok\" }"}</code>.</li>
                      <li>Open the app at <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">http://localhost:5173</a> (Vite dev server) so API calls are proxied to the backend.</li>
                      <li>Then try <strong>Send OTP</strong> again.</li>
                    </ol>
                  </div>
                )}
              </>
            )}

            {step === "phone" && (
              <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-3" noValidate>
                <FormField label="Phone number" required error={phoneForm.formState.errors.number?.message}>
                  <div className="flex gap-2">
                    <select
                      className="h-10 w-24 shrink-0 rounded-md border border-surface-border bg-surface-base px-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                      {...phoneForm.register("countryCode")}
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
                      error={!!phoneForm.formState.errors.number}
                      className="flex-1"
                      {...phoneForm.register("number")}
                    />
                  </div>
                </FormField>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={sendOtpLoading}
                  type="submit"
                  className="mt-6 flex h-12 w-full items-center justify-center"
                  data-testid="send-otp-btn"
                  disabled={sendOtpLoading}
                >
                  Send OTP
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-3" noValidate>
                <p className="text-xs text-text-muted">Code sent to {phoneSent}</p>
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember-me"
                    className="h-5 w-5 cursor-pointer rounded border-border-subtle bg-transparent text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
                    {...otpForm.register("rememberMe")}
                  />
                  <label htmlFor="remember-me" className="text-sm text-text-secondary">
                    Remember me for 7 days
                  </label>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={otpForm.formState.isSubmitting}
                  type="submit"
                  className="mt-6 flex h-12 w-full items-center justify-center"
                  data-testid="verify-otp-btn"
                  disabled={otpForm.formState.isSubmitting}
                >
                  Verify & Login
                </Button>
                <button
                  type="button"
                  onClick={backToPhone}
                  className="mt-2 w-full text-sm text-text-muted hover:text-text-primary"
                >
                  Use a different number
                </button>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-text-secondary">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-brand-accent hover:underline">Create one free</Link>
            </p>
            <p className="mt-2 text-center text-xs text-text-muted">{brand.appVersion}</p>
          </div>
        </div>
      </div>
    </>
  );
}
