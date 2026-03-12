'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { RiShieldStarFill } from "react-icons/ri";
import { HiMail, HiLockClosed, HiCheckCircle } from "react-icons/hi";
import { useToast } from "@/contexts/ToastContext";
import DeviceVerification from '@/components/auth/DeviceVerification';

export default function Login() {
    const { login, pendingDeviceAuth } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Next.js replacement for location.state
    const registered = searchParams.get("registered") === "true";
    const registrationMessage = registered ? "Registration successful! Please log in." : null;

    // Check if redirected after successful email verification
    const verifiedMessage = searchParams.get("verified") === "true";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result && result.device_trusted) {
                router.refresh();
                router.push("/");
            }
        } catch (err: any) {
            const status = err.response?.data?.status;
            
            if (status === "pending_approval") {
                localStorage.setItem("pendingEmail", email);
                router.push("/verify-pending");
                return;
            }

            if (status === "unverified_email") {
                setError("Please verify your email address first. Check your inbox for the link.");
                return;
            }

            setError(
                err.response?.data?.message ||
                err.message ||
                "Invalid credentials. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    if (pendingDeviceAuth) {
        return <DeviceVerification />;
    }

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
                                href="/forgot-password"
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
                        Don&apos;t have an account?{" "}
                        <Link href="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
