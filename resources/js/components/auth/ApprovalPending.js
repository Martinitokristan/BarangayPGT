import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { HiClock, HiArrowLeft } from "react-icons/hi";

export default function ApprovalPending() {
    const { user, logout, fetchUser } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        window.location.href = "/login";
        return null;
    }

    // Poll every 5 seconds to detect when admin approves the account
    const pollRef = useRef(null);
    useEffect(() => {
        const check = async () => {
            try {
                const userData = await fetchUser();
                if (userData?.is_approved) {
                    clearInterval(pollRef.current);
                    navigate("/");
                }
            } catch (_) {
                // ignore network blips
            }
        };

        pollRef.current = setInterval(check, 5000);
        return () => clearInterval(pollRef.current);
    }, []);

    return (
        <div className="auth-container verification-isolated">
            <div
                className="auth-card verification-card text-center"
                style={{ padding: "40px" }}
            >
                <div className="auth-header">
                    <div
                        className="auth-icon"
                        style={{
                            fontSize: "4rem",
                            color: "#f59e0b",
                            marginBottom: "20px",
                        }}
                    >
                        <HiClock />
                    </div>
                    <h1>Account Pending Approval</h1>
                    <p
                        style={{
                            fontSize: "1.1rem",
                            color: "#4B5563",
                            marginTop: "15px",
                            lineHeight: "1.6",
                        }}
                    >
                        Your account is under review. A barangay admin will
                        verify your identity and approve your account.
                    </p>
                    <p
                        style={{
                            fontSize: "0.95rem",
                            color: "#6B7280",
                            marginTop: "10px",
                        }}
                    >
                        This usually takes 1–2 days. You'll receive an SMS
                        notification once approved.
                    </p>
                </div>

                {/* Subtle animated dots to show the page is alive and polling */}
                <div
                    style={{
                        margin: "20px 0",
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
                                background: "#f59e0b",
                                display: "inline-block",
                                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                                opacity: 0.6,
                            }}
                        />
                    ))}
                </div>

                <div
                    style={{
                        marginTop: "30px",
                        paddingTop: "20px",
                        borderTop: "1px solid #E5E7EB",
                    }}
                >
                    <p
                        style={{
                            color: "#6B7280",
                            marginBottom: "15px",
                            fontSize: "0.875rem",
                        }}
                    >
                        You can close this page and come back anytime. Your
                        progress is saved.
                    </p>

                    <button
                        className="btn-link"
                        onClick={logout}
                        style={{
                            color: "#ef4444",
                            textDecoration: "none",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            gap: "8px",
                        }}
                    >
                        <HiArrowLeft /> Log out and try another account
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
