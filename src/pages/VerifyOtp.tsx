import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";

type OtpError = {
  kind: "expired" | "invalid" | "rate_limited" | "generic";
  message: string;
};

function classifyOtpError(err: unknown): OtpError {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const msg = raw.toLowerCase();
  if (msg.includes("expired") || msg.includes("otp_expired")) {
    return {
      kind: "expired",
      message: "This code has expired. Request a new one to continue.",
    };
  }
  if (msg.includes("invalid") || msg.includes("token") || msg.includes("not found")) {
    return {
      kind: "invalid",
      message: "That code doesn't match. Double-check the email and try again, or resend a new code.",
    };
  }
  if (msg.includes("rate") || msg.includes("too many")) {
    return {
      kind: "rate_limited",
      message: "Too many attempts. Please wait a moment before trying again.",
    };
  }
  return { kind: "generic", message: raw || "Verification failed. Please try again." };
}


type Role = "customer" | "merchant";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { email?: string; role?: Role } | null) ?? null;
  const email = state?.email ?? "";
  const role: Role = state?.role ?? "customer";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState<OtpError | null>(null);

  const backAuthPath = role === "merchant" ? "/merchant/auth" : "/customer/auth";

  useEffect(() => {
    if (!email) {
      navigate(backAuthPath, { replace: true });
    }
  }, [email, navigate, backAuthPath]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Clear error as soon as user starts editing the code again
  const handleCodeChange = (value: string) => {
    setCode(value);
    if (otpError) setOtpError(null);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6) {
      setOtpError({ kind: "invalid", message: "Please enter the full 6-digit code." });
      return;
    }
    setLoading(true);
    setOtpError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (error) throw error;

      toast.success("Email verified!");
      if (role === "merchant") {
        navigate("/merchant/confirmation");
      } else {
        navigate("/customer/confirmation");
      }
    } catch (err: unknown) {
      const classified = classifyOtpError(err);
      setOtpError(classified);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success("A new code has been sent to your email");
      setOtpError(null);
      setCode("");
      setCooldown(45);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not resend code";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center animate-fade-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              Perk <span className="text-secondary">Back</span>
            </span>
          </Link>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
            <Mail className="text-secondary" size={26} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Verify your email</h1>
          <p className="text-muted-foreground mt-2">
            We sent a 6-digit code to
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="bg-card rounded-2xl p-8 shadow-card space-y-6 animate-fade-up-delay-1"
        >
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={handleCodeChange} autoFocus>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {otpError && (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 space-y-3"
            >
              <div className="flex gap-2 items-start text-destructive">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div className="text-sm leading-relaxed">{otpError.message}</div>
              </div>
              {(otpError.kind === "expired" || otpError.kind === "invalid") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="w-full"
                >
                  {cooldown > 0
                    ? `Send a new code in ${cooldown}s`
                    : resending
                    ? "Sending new code..."
                    : "Send a new code"}
                </Button>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Didn't get a code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-secondary hover:underline disabled:opacity-60 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
            </button>
          </div>
        </form>

        <div className="text-center mt-6 animate-fade-up-delay-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={backAuthPath}>
              <ArrowLeft size={16} />
              Use a different email
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
