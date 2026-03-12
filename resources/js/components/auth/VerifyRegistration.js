import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { HiMail } from "react-icons/hi";

const POLL_INTERVAL_MS = 3000;

export default function VerifyRegistration() {
    const { pollRegistrationStatus, resendRegistrationOtp } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";

    const [sending, setSending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [resendError, setResendError] = useState("");

    const intervalRef = useRef(null);

    // Redirect to register if no email in URL
    useEffect(() => {
        if (!email) navigate("/register");
    }, [email]);

    // ── Poll every 3s
    useEffect(() => {
        if (!email) return;

        const poll = async () => {
            try {
                const data = await pollRegistrationStatus(email);
                if (data.verified) {
                    clearInterval(intervalRef.current);
                    // Hard redirect so AuthContext re-initialises cleanly
                    // from the token that verifyAndLogin already saved to localStorage
                    window.location.replace("/");
                }
            } catch (_) {
                // silently ignore network blips — keep polling
            }
        };

        poll(); // immediate first check
        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

        return () => clearInterval(intervalRef.current);
    }, [email]);

    // ── Resend link ──────────────────────────────────────────────────────────
    const handleResend = async () => {
        setSending(true);
        setResendMessage("");
        setResendError("");
        try {
            const res = await resendRegistrationOtp(email);
            setResendMessage(
                res.message || "A new verification link has been sent!",
            );
        } catch (err) {
            setResendError(
                err.response?.data?.message ||
                    "Failed to resend. Please try again.",
            );
        } finally {
            setSending(false);
        }
    };

    // ── Waiting screen ───────────────────────────────────────────────────────
    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: "center" }}>
                <div className="auth-header">
                    <span className="auth-icon">
                        <HiMail size={48} />
                    </span>
                    <h1 className="auth-title">Verify Your Email</h1>
                    <p className="auth-subtitle">
                        We've sent an email to <strong>{email}</strong>.
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
                                borderRadius: "50%",
                                background: "#1d4ed8",
                                display: "inline-block",
                                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                                opacity: 0.6,
                            }}
                        />
                    ))}
                </div>

                <hr style={{ borderColor: "#e5e7eb", margin: "0 0 20px" }} />

                {resendMessage && (
                    <div className="alert alert-success">{resendMessage}</div>
                )}
                {resendError && (
                    <div className="alert alert-danger">{resendError}</div>
                )}

                <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                    Didn't receive the email?
                </p>
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleResend}
                    disabled={sending}
                    style={{ minWidth: 160 }}
                >
                    {sending ? "Sending…" : "Resend Link"}
                </button>

                <p className="mt-4" style={{ marginBottom: 0 }}>
                    <button
                        type="button"
                        className="btn btn-link p-0 text-danger"
                        onClick={() => navigate("/register")}
                        style={{ fontSize: "0.875rem" }}
                    >
                        ← Log out and try another account
                    </button>
                </p>

                <style>{`
                    @keyframes pulse {
                        0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
                        40% { transform: scale(1.2); opacity: 1; }
                    }
                `}</style>
            </div>
        </div>
    );
}
