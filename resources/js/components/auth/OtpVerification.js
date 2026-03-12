import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { HiShieldCheck, HiCheckCircle, HiArrowLeft } from "react-icons/hi";

export default function OtpVerification() {
    const { pendingAuth, logout, verifyCode, resendCode } = useAuth();
    const navigate = useNavigate();

    // Kick back to login if no pending auth context exists (page refresh in pending state)
    if (!pendingAuth || !pendingAuth.user) {
        navigate("/login");
        return null;
    }

    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = [
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
    ];

    // Focus first input on mount
    useEffect(() => {
        if (inputRefs[0] && inputRefs[0].current) {
            inputRefs[0].current.focus();
        }
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs[index + 1].current.focus();
        }
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

        // Focus the last filled input or the first empty one
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
            await verifyCode(fullCode);
            // Redirection is handled in AuthContext after successful verification
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired code.");
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        setSending(true);
        setMessage("");
        setError("");
        try {
            const res = await resendCode();
            setMessage(res.message || "New verification code sent!");
            setCode(["", "", "", "", "", ""]);
            inputRefs[0].current.focus();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend code.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="auth-container verification-isolated">
            <div className="auth-card verification-card">
                <div className="auth-header text-center">
                    <div className="auth-icon verification-icon">
                        <HiShieldCheck />
                    </div>
                    <h1>New Device Login</h1>
                    <p className="verification-subtitle">
                        To secure your account, please enter the 6-digit code we
                        sent to <br />
                        <strong>{pendingAuth.user.email}</strong>
                    </p>
                </div>

                {message && (
                    <div className="alert alert-success">
                        <HiCheckCircle /> {message}
                    </div>
                )}
                {error && <div className="alert alert-error">{error}</div>}

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
                        {verifying ? "Verifying..." : "Verify Device"}
                    </button>
                </form>

                <div className="verification-footer text-center">
                    <p>Didn't receive the code?</p>
                    <button
                        className="btn-link"
                        onClick={handleResend}
                        disabled={sending}
                    >
                        {sending ? "Sending..." : "Resend Code"}
                    </button>

                    <div className="logout-divider">
                        <span>or</span>
                    </div>

                    <button
                        className="btn-link logout-btn"
                        onClick={() => {
                            logout();
                            navigate("/login");
                        }}
                    >
                        <HiArrowLeft /> Cancel Login
                    </button>
                </div>
            </div>

            <style>{`
                .verification-isolated {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-light);
                    padding: 20px;
                }
                .verification-card {
                    max-width: 450px;
                    width: 100%;
                }
                .verification-icon {
                    font-size: 3.5rem;
                    color: var(--primary-color);
                    margin-bottom: 1rem;
                }
                .verification-subtitle {
                    color: var(--text-muted);
                    font-size: 0.95rem;
                    margin-top: 0.5rem;
                }
                .code-input-group {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin: 2rem 0;
                }
                .code-digit-input {
                    width: 42px;
                    height: 52px;
                    text-align: center;
                    font-size: 1.25rem;
                    font-weight: bold;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .code-digit-input:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    outline: none;
                }
                .btn-block {
                    width: 100%;
                    padding: 0.75rem;
                    font-size: 1rem;
                }
                .verification-footer {
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #f1f5f9;
                }
                .btn-link {
                    background: none;
                    border: none;
                    color: var(--primary-color);
                    font-weight: 600;
                    cursor: pointer;
                    padding: 5px;
                }
                .btn-link:disabled {
                    opacity: 0.5;
                }
                .logout-divider {
                    margin: 1rem 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                }
                .logout-divider::before, .logout-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
                .logout-divider span {
                    margin: 0 10px;
                }
                .logout-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin: 0 auto;
                }
            `}</style>
        </div>
    );
}
