'use client';

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { RiShieldStarFill } from "react-icons/ri";
import {
    HiLockClosed,
    HiCheckCircle,
    HiPhone,
    HiArrowLeft,
    HiExclamationCircle,
    HiEye,
    HiEyeOff,
} from "react-icons/hi";

function ResetPasswordOtpContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { resetPasswordOtp } = useAuth();

    const phone = searchParams.get("phone") || "";

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const invalidLink = !phone;
    const passwordMatches =
        password.length > 0 && confirmPassword.length > 0
            ? password === confirmPassword
            : null;

    const meetsPasswordPolicy = (value: string) =>
        /^(?=.*[A-Za-z])(?=.*\d).{10,}$/.test(value);
    const passwordPolicyMessage =
        "Password must be at least 10 characters and include letters and numbers.";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
            setError("Please enter the 6-digit code from the SMS.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match. Please try again.");
            return;
        }

        if (!meetsPasswordPolicy(password)) {
            setError(passwordPolicyMessage);
            return;
        }

        setLoading(true);
        try {
            // resetPasswordOtp sends {phone, token: otp, password, password_confirmation}
            await resetPasswordOtp(
                phone,
                otp.trim(),
                password,
                confirmPassword,
            );
            setSuccess(true);
            setTimeout(() => router.push("/"), 2000);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Invalid or expired code. Please request a new one.",
            );
        } finally {
            setLoading(false);
        }
    };

    if (invalidLink) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <div className="auth-header">
                        <span
                            className="auth-icon"
                            style={{ color: "#ef4444" }}
                        >
                            <HiPhone />
                        </span>
                        <h1>Invalid Link</h1>
                        <p>
                            This page requires a phone number in the URL. Please
                            start from the Forgot Password page.
                        </p>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="btn btn-primary btn-block"
                        style={{ display: "block", textAlign: "center" }}
                    >
                        <HiArrowLeft style={{ display: "inline", marginRight: "6px" }} />
                        Request a New Code
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <div className="auth-header">
                        <span
                            className="auth-icon"
                            style={{ color: "#22c55e" }}
                        >
                            <HiCheckCircle />
                        </span>
                        <h1>Password Reset!</h1>
                        <p>
                            Your password has been changed successfully. You are
                            now logged in. Redirecting you to the
                            dashboard&hellip;
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-icon">
                        <RiShieldStarFill />
                    </span>
                    <h1>Enter Your Code</h1>
                    <p>
                        Enter the 6-digit code sent to your phone and choose a
                        new password.
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Show the account email so the user knows which account */}
                <div
                    className="alert"
                    style={{
                        background: "#f0f9ff",
                        borderLeft: "4px solid #3b82f6",
                        color: "#1e40af",
                        marginBottom: "1rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                    }}
                >
                    Resetting password for account linked to:{" "}
                    <strong>{phone}</strong>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="otp" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HiPhone /> 6-Digit SMS Code
                        </label>
                        <input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            pattern="\d{6}"
                            maxLength={6}
                            value={otp}
                            onChange={(e) =>
                                setOtp(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="123456"
                            required
                            style={{
                                letterSpacing: "0.4em",
                                fontSize: "1.4rem",
                                textAlign: "center",
                            }}
                            className="form-control"
                        />
                        <small style={{ color: "#6b7280", display: 'block', marginTop: '4px', fontSize: '12px' }}>
                            This code expires in 15 minutes.
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HiLockClosed /> New Password
                        </label>
                        <div
                            className="password-input-wrapper"
                            style={{ position: "relative" }}
                        >
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 10 chars, letters & numbers"
                                required
                                minLength={10}
                                className="form-control"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                style={{
                                    position: "absolute",
                                    right: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    color: "#6b7280",
                                }}
                            >
                                {showPassword ? <HiEyeOff /> : <HiEye />}
                            </button>
                        </div>
                        <small className="password-policy-text text-muted" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
                            {passwordPolicyMessage}
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm-password" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HiLockClosed /> Confirm New Password
                        </label>
                        <div
                            className="password-input-wrapper"
                            style={{ position: "relative" }}
                        >
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Re-enter your new password"
                                required
                                minLength={10}
                                className="form-control"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword((prev) => !prev)
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide confirmation password"
                                        : "Show confirmation password"
                                }
                                style={{
                                    position: "absolute",
                                    right: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    color: "#6b7280",
                                }}
                            >
                                {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                            </button>
                        </div>
                        {passwordMatches !== null && (
                            <div
                                className="password-match-indicator"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    color: passwordMatches
                                        ? "#16a34a"
                                        : "#dc2626",
                                    fontSize: "0.85rem",
                                    marginTop: "0.35rem",
                                }}
                            >
                                {passwordMatches ? (
                                    <HiCheckCircle />
                                ) : (
                                    <HiExclamationCircle />
                                )}
                                <span>
                                    {passwordMatches
                                        ? "Passwords match"
                                        : "Passwords do not match"}
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-spinner d-inline-block">
                                Resetting password&hellip;
                            </span>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>

                <div className="auth-footer mt-4 text-center">
                    <p>
                        Didn&apos;t receive a code?{" "}
                        <Link href="/forgot-password">Request a new one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordOtp() {
    return (
        <Suspense fallback={<div className="loading-screen">Loading...</div>}>
            <ResetPasswordOtpContent />
        </Suspense>
    );
}
