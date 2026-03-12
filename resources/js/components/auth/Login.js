import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { RiShieldStarFill } from "react-icons/ri";
import { HiMail, HiLockClosed, HiCheckCircle } from "react-icons/hi";

export default function Login() {
    const { login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Show registration success message if redirected from register page
    const registrationMessage = location.state?.registrationSuccess;

    // Check if redirected after successful email verification
    const queryParams = new URLSearchParams(location.search);
    const verifiedMessage = queryParams.get("verified") === "true";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await login(email, password);
            // After login, if the device is untrusted, the AuthContext
            // will set pendingAuth and we should navigate to verification
            if (!result.device_trusted) {
                navigate("/verify-pending");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Invalid credentials. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-icon">
                        <RiShieldStarFill />
                    </span>
                    <h1>Barangay Online</h1>
                    <p>Welcome back! Please sign in.</p>
                </div>

                {(registrationMessage || verifiedMessage) && (
                    <div
                        className="alert alert-success"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <HiCheckCircle
                            style={{ flexShrink: 0, fontSize: "1.2rem" }}
                        />
                        <span>
                            {verifiedMessage
                                ? "Email verified successfully! Please log in to continue."
                                : registrationMessage}
                        </span>
                    </div>
                )}

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">
                            <HiMail /> Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            <HiLockClosed /> Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                        {/* Forgot Password link — shown inline for quick access */}
                        <div style={{ textAlign: "right", marginTop: "4px" }}>
                            <Link
                                to="/forgot-password"
                                style={{
                                    fontSize: "0.82rem",
                                    color: "#2563eb",
                                }}
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-spinner">
                                Signing in...
                            </span>
                        ) : (
                            "Sign In to Your Account"
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{" "}
                        <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
