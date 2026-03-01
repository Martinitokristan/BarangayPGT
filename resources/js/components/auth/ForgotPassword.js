import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { RiShieldStarFill } from "react-icons/ri";
import { HiMail, HiPhone, HiArrowLeft, HiCheckCircle } from "react-icons/hi";

/**
 * ForgotPassword
 *
 * Allows a user to request a password reset delivered via:
 *   - Email → sends a signed reset LINK to the registered email address
 *   - Phone → sends a short 6-digit OTP via SMS (no URL — avoids SMS
 *             phishing filters that block long links)
 *
 * Email flow:  success screen → user clicks link in email → /reset-password
 * Phone flow:  success → navigate to /reset-password-otp?email=<encoded>
 */
export default function ForgotPassword() {
    const { forgotPassword } = useAuth();
    const navigate = useNavigate();

    const [method, setMethod] = useState("email"); // 'email' | 'phone'
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    // Only used for the email success screen (phone redirects immediately)
    const [submittedIdentifier, setSubmittedIdentifier] = useState("");

    const placeholder =
        method === "email"
            ? "Enter your email address"
            : "Enter your phone number";
    const inputType = method === "email" ? "email" : "tel";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const trimmed = identifier.trim();
        try {
            await forgotPassword(method, trimmed);

            if (method === "phone") {
                // Phone flow: we need the email to pass to the OTP page.
                // Because the API returns a generic response (no email exposed),
                // we keep the identifier the user typed and pass it as a hint
                // so the backend can look it up again on the OTP page.
                // The actual email lookup happens server-side; we just pass
                // the phone number so the OTP page knows which account to target.
                // We encode the phone as ?email= param but the OTP page reads
                // it as an opaque identifier — the backend resolves it via phone.
                navigate(
                    `/reset-password-otp?phone=${encodeURIComponent(trimmed)}`,
                );
            } else {
                setSubmittedIdentifier(trimmed);
                setSuccess(true);
            }
        } catch (err) {
            // Show a generic message to prevent information leakage
            setError(
                err.response?.data?.message ||
                    "Something went wrong. Please try again later.",
            );
        } finally {
            setLoading(false);
        }
    };

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
                        <h1>Check Your Inbox</h1>
                        <p>
                            If an account with that email address exists, we
                            have sent a password reset link to{" "}
                            <strong>{submittedIdentifier}</strong>. The link
                            expires in 60 minutes.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="btn btn-primary btn-block"
                        style={{ display: "block", textAlign: "center" }}
                    >
                        <HiArrowLeft style={{ marginRight: "6px" }} />
                        Back to Sign In
                    </Link>
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
                    <h1>Forgot Password</h1>
                    <p>Choose how you would like to receive your reset link.</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Method selector */}
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label>Reset via</label>
                    <div
                        style={{
                            display: "flex",
                            gap: "0.75rem",
                            marginTop: "0.25rem",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setMethod("email");
                                setIdentifier("");
                            }}
                            className={`btn ${method === "email" ? "btn-primary" : "btn-secondary"}`}
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                            }}
                        >
                            <HiMail /> Email
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMethod("phone");
                                setIdentifier("");
                            }}
                            className={`btn ${method === "phone" ? "btn-primary" : "btn-secondary"}`}
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                            }}
                        >
                            <HiPhone /> Phone Number
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="identifier">
                            {method === "email" ? (
                                <>
                                    <HiMail /> Email Address
                                </>
                            ) : (
                                <>
                                    <HiPhone /> Phone Number
                                </>
                            )}
                        </label>
                        <input
                            id="identifier"
                            type={inputType}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder={placeholder}
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-spinner">
                                Sending reset link…
                            </span>
                        ) : (
                            `Send Reset Link via ${method === "email" ? "Email" : "SMS"}`
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        <Link to="/login">
                            <HiArrowLeft
                                style={{
                                    verticalAlign: "middle",
                                    marginRight: "4px",
                                }}
                            />
                            Back to Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
