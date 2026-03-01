import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { RiShieldStarFill } from "react-icons/ri";
import {
    HiLockClosed,
    HiCheckCircle,
    HiExclamationCircle,
    HiEye,
    HiEyeOff,
} from "react-icons/hi";

/**
 * ResetPassword
 *
 * Accepts a `?token=…&email=…` URL (sent by email or SMS) and lets the user
 * choose a new password.  On success the user is automatically logged in and
 * redirected to the feed/dashboard.
 */
export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { resetPassword } = useAuth();

    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Guard: if the link is missing the required params show a clear error
    const invalidLink = !token || !email;
    const passwordMatches =
        password.length > 0 && confirmPassword.length > 0
            ? password === confirmPassword
            : null;

    const meetsPasswordPolicy = (value) =>
        /^(?=.*[A-Za-z])(?=.*\d).{10,}$/.test(value);
    const passwordPolicyMessage =
        "Password must be at least 10 characters and include letters and numbers.";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

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
            await resetPassword(token, email, password, confirmPassword);
            setSuccess(true);
            // Brief pause so the user sees the success state, then go to feed
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to reset password. The link may have expired. Please request a new one.",
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
                            <HiExclamationCircle />
                        </span>
                        <h1>Invalid Reset Link</h1>
                        <p>
                            This password reset link is missing required
                            information. Please request a new link.
                        </p>
                    </div>
                    <button
                        className="btn btn-primary btn-block"
                        onClick={() => navigate("/forgot-password")}
                    >
                        Request a New Reset Link
                    </button>
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
                            now logged in. Redirecting you to the dashboard…
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
                    <h1>Reset Password</h1>
                    <p>
                        Enter your new password below. You will be logged in
                        automatically after resetting.
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Show the email so the user knows which account they're resetting */}
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
                    Resetting password for: <strong>{email}</strong>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="password">
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
                        <small className="password-policy-text">
                            {passwordPolicyMessage}
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm-password">
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
                            <span className="loading-spinner">
                                Resetting password…
                            </span>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
