'use client';

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { HiMail } from "react-icons/hi";

const POLL_INTERVAL_MS = 3000;

function VerifyRegistrationContent() {
    const { pollRegistrationStatus, resendRegistrationOtp, verifyAndLogin } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [sending, setSending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [resendError, setResendError] = useState("");

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Redirect to register if no email in URL
    useEffect(() => {
        if (!email) router.push("/register");
    }, [email, router]);

    // Poll every 3s
    useEffect(() => {
        if (!email) return;

        const poll = async () => {
            try {
                const data = await pollRegistrationStatus(email);
                if (data.verified) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    
                    if (data.approved && data.token && data.user) {
                        localStorage.setItem("token", data.token);
                        verifyAndLogin(data.user, data.token);
                    } else {
                        // Email is verified, but admin has not approved yet. Track the email for the pending screen.
                        localStorage.setItem("pendingEmail", email);
                    }

                    window.location.replace("/verify-pending");
                }
            } catch (_) {
                // silently ignore network blips — keep polling
            }
        };

        poll(); // immediate first check
        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [email, pollRegistrationStatus, verifyAndLogin]);

    const handleResend = async () => {
        setSending(true);
        setResendMessage("");
        setResendError("");
        try {
            const res = await resendRegistrationOtp(email);
            setResendMessage(
                res.message || "A new verification link has been sent!",
            );
        } catch (err: any) {
            setResendError(
                err.response?.data?.message ||
                "Failed to resend. Please try again.",
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: "center" }}>
                <div className="auth-header">
                    <span className="auth-icon">
                        <HiMail size={48} />
                    </span>
                    <h1 className="auth-title">Verify Your Email</h1>
                    <p className="auth-subtitle">
                        We have sent an email to <strong>{email}</strong>.
                        <br />
                        Please click the link inside to verify your account and
                        continue.
                    </p>
                </div>

                {/* Subtle animated dots to show the page is alive and polling */}
                <div
                    style={{
                        margin: "8px 0 20px",
                        display: "flex",
                        justifyContent: "center",
                        gap: 6,
                    }}
                >
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            style={{
                                width: 8,
                                height: 8,
                                background: "#2563eb",
                                borderRadius: "50%",
                                animation: `pulse 1.4s infinite ease-in-out both`,
                                animationDelay: `${i * 0.16}s`,
                            }}
                        />
                    ))}
                </div>

                <style>{`
          @keyframes pulse {
            0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
                <hr style={{ borderColor: "#e5e7eb", margin: "0 0 20px" }} />

                <div className="auth-divider">
                    <span>Did not receive it?</span>
                </div>

                {resendMessage && (
                    <div
                        className="alert alert-success"
                        style={{ marginTop: 12 }}
                    >
                        {resendMessage}
                    </div>
                )}
                {resendError && (
                    <div className="alert alert-error" style={{ marginTop: 12 }}>
                        {resendError}
                    </div>
                )}

                <button
                    onClick={handleResend}
                    disabled={sending}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontWeight: 500,
                        cursor: sending ? "not-allowed" : "pointer",
                        textDecoration: "underline",
                        opacity: sending ? 0.6 : 1,
                    }}
                >
                    {sending ? "Sending..." : "Resend Link"}
                </button>
            </div>
        </div>
    );
}

export default function VerifyRegistration() {
    return (
        <Suspense fallback={<div className="auth-container">Loading...</div>}>
            <VerifyRegistrationContent />
        </Suspense>
    );
}
