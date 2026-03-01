import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { HiShieldCheck } from "react-icons/hi";

export default function VerifyRegistration() {
    const { verifyRegistration, resendRegistrationOtp } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";

    // If no email in URL, send back to register
    useEffect(() => {
        if (!email) navigate("/register");
    }, [email]);

    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [verifying, setVerifying] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const inputRefs = [
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
    ];

    useEffect(() => {
        if (inputRefs[0]?.current) inputRefs[0].current.focus();
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);
        if (value && index < 5) inputRefs[index + 1].current.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;
        const newCode = [...code];
        pastedData.split("").forEach((char, i) => {
            if (i < 6) newCode[i] = char;
        });
        setCode(newCode);
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs[nextIndex].current.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join("");
        if (fullCode.length !== 6) {
            setError("Please enter all 6 digits.");
            return;
        }
        setVerifying(true);
        setError("");
        setMessage("");
        try {
            await verifyRegistration(email, fullCode);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired code.");
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        setSending(true);
        setError("");
        setMessage("");
        try {
            const res = await resendRegistrationOtp(email);
            setMessage(res.message || "New code sent!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend code.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-icon">
                        <HiShieldCheck size={36} />
                    </span>
                    <h1 className="auth-title">Verify Your Email</h1>
                    <p className="auth-subtitle">
                        We sent a 6-digit code to <strong>{email}</strong>.
                        <br />
                        Enter it below to complete your registration.
                    </p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {message && (
                    <div className="alert alert-success">{message}</div>
                )}

                <form onSubmit={handleSubmit} className="verification-form">
                    <div className="code-input-group">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index]}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) =>
                                    handleChange(index, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="code-digit-input"
                                autoComplete="one-time-code"
                                pattern="\d*"
                                inputMode="numeric"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={verifying || code.some((d) => !d)}
                    >
                        {verifying ? "Verifying..." : "Verify & Create Account"}
                    </button>
                </form>

                <div className="verification-footer text-center mt-3">
                    <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                        Didn't receive the code?
                    </p>
                    <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={handleResend}
                        disabled={sending}
                        style={{ fontSize: "0.875rem" }}
                    >
                        {sending ? "Sending..." : "Resend Code"}
                    </button>
                    <p className="mt-3">
                        <button
                            type="button"
                            className="btn btn-link p-0 text-muted"
                            onClick={() => navigate("/register")}
                            style={{ fontSize: "0.875rem" }}
                        >
                            &larr; Back to Register
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
