import React, { useState, useRef, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { HiMail, HiCheckCircle, HiArrowLeft } from "react-icons/hi";

export default function VerificationPending() {
    const { user, pendingAuth, logout, verifyCode, resendCode } = useAuth();
    const activeUser = user || pendingAuth?.user;
    
    // Kick back to login if no auth context exists (page refresh in pending state)
    if (!activeUser) {
        window.location.href = "/login";
        return null;
    }

    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleResend = async () => {
        setSending(true);
        setMessage("");
        setError("");
        try {
            const res = await api.post("/email/verification-notification");
            setMessage(res.data.status === 'verification-link-sent' 
                ? "A new verification link has been sent to your email address." 
                : "New verification link sent!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend link. Please try again later.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="auth-container verification-isolated">
            <div className="auth-card verification-card text-center" style={{ padding: '40px' }}>
                <div className="auth-header">
                    <div className="auth-icon verification-icon" style={{ fontSize: '4rem', color: '#2563EB', marginBottom: '20px' }}>
                        <HiMail />
                    </div>
                    <h1>Verify Your Email</h1>
                    <p className="verification-subtitle" style={{ fontSize: '1.1rem', color: '#4B5563', marginTop: '15px' }}>
                        We've sent an email to <strong>{activeUser.email}</strong>.<br />
                        Please click the link inside to verify your account and continue.
                    </p>
                </div>

                {message && <div className="alert alert-success" style={{ marginTop: '20px' }}><HiCheckCircle /> {message}</div>}
                {error && <div className="alert alert-error" style={{ marginTop: '20px' }}>{error}</div>}

                <div className="verification-footer" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                    <p style={{ color: '#6B7280', marginBottom: '10px' }}>Didn't receive the email?</p>
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleResend} 
                        disabled={sending}
                        style={{ padding: '10px 20px' }}
                    >
                        {sending ? "Sending..." : "Resend Link"}
                    </button>

                    <div className="logout-divider" style={{ margin: '20px 0', borderTop: '1px solid #f3f4f6' }}></div>

                    <button 
                        className="btn-link logout-btn" 
                        onClick={logout}
                        style={{ color: '#ef4444', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '8px' }}
                    >
                        <HiArrowLeft /> Log out and try another account
                    </button>
                </div>
            </div>

            <style jsx>{`
                .verification-isolated {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-light);
                    padding: 20px;
                }
                .verification-card {
                    max-width: 500px;
                    width: 100%;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
            `}</style>
        </div>
    );
}
