'use client';

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { HiClock } from "react-icons/hi";

export default function VerificationPending() {
    const { logout, verifyAndLogin } = useAuth();
    const router = useRouter();
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);

    useEffect(() => {
        const email = localStorage.getItem("pendingEmail");
        if (!email) {
            router.push("/login");
            return;
        }
        setPendingEmail(email);

        const check = async () => {
            try {
                // We use standard fetch here to avoid circular dependency loop and axios interceptors needing tokens
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-status?email=${encodeURIComponent(email)}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                if (!res.ok) return;
                const data = await res.json();
                
                if (data.verified && data.approved && data.token && data.user) {
                    if (pollRef.current) clearInterval(pollRef.current);
                    localStorage.removeItem("pendingEmail");
                    localStorage.setItem("token", data.token);
                    verifyAndLogin(data.user, data.token);
                    router.push("/");
                }
            } catch (_) {}
        };

        check();
        pollRef.current = setInterval(check, 5000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [router, verifyAndLogin]);

    if (!pendingEmail) return null;

    return (
        <div className="pending-verification-page">
            <div className="glass-container">
                <div className="status-badge">Awaiting Verification</div>
                
                <div className="icon-wrapper">
                    <div className="pulse-ring"></div>
                    <HiClock className="main-icon" />
                </div>

                <h1 className="title">Registration Received</h1>
                
                <div className="info-card">
                    <p className="primary-text">
                        Your account for <strong>{pendingEmail}</strong> is now in our system.
                    </p>
                    <p className="secondary-text">
                        Our administrators are currently reviewing your Valid ID. This process typically takes 12-24 hours.
                    </p>
                </div>

                <div className="next-steps">
                    <div className="step">
                        <span className="step-dot"></span>
                        <span>Email Verified</span>
                    </div>
                    <div className="step processing">
                        <span className="step-dot pulse"></span>
                        <span>Admin Reviewing ID</span>
                    </div>
                </div>

                <div className="notif-box">
                    <p>We'll send an SMS to your registered number once you're cleared!</p>
                </div>

                <div className="actions">
                    <button className="btn-secondary" onClick={() => { localStorage.removeItem('pendingEmail'); router.push("/login"); }}>
                        Back to Login
                    </button>
                    <p className="hint">The page will refresh automatically upon approval.</p>
                </div>
            </div>

            <style>{`
                .pending-verification-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at top right, #1e293b, #0f172a);
                    font-family: 'Inter', sans-serif;
                    padding: 20px;
                }

                .glass-container {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 48px;
                    max-width: 540px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .status-badge {
                    display: inline-block;
                    background: rgba(245, 158, 11, 0.1);
                    color: #fbbf24;
                    padding: 6px 16px;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 32px;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }

                .icon-wrapper {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .main-icon {
                    font-size: 4rem;
                    color: #f59e0b;
                    z-index: 2;
                }

                .pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: rgba(245, 158, 11, 0.2);
                    border-radius: 50%;
                    animation: ringPulse 2s infinite;
                }

                @keyframes ringPulse {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }

                .title {
                    color: white;
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 24px;
                    letter-spacing: -0.02em;
                }

                .info-card {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 32px;
                }

                .primary-text {
                    color: #e2e8f0;
                    font-size: 1.1rem;
                    line-height: 1.6;
                    margin-bottom: 12px;
                }

                .secondary-text {
                    color: #94a3b8;
                    font-size: 0.95rem;
                    line-height: 1.6;
                }

                .next-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 40px;
                    align-items: center;
                }

                .step {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .step.processing {
                    color: #fbbf24;
                }

                .step-dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                }

                .step-dot.pulse {
                    background: #fbbf24;
                    box-shadow: 0 0 10px #fbbf24;
                    animation: dotPulse 1.5s infinite;
                }

                @keyframes dotPulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                }

                .notif-box {
                    background: linear-gradient(90deg, rgba(245, 158, 11, 0.05), transparent);
                    border-left: 3px solid #f59e0b;
                    padding: 16px;
                    text-align: left;
                    margin-bottom: 40px;
                }

                .notif-box p {
                    color: #cbd5e1;
                    font-size: 0.85rem;
                    margin: 0;
                }

                .btn-secondary {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 14px 32px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .hint {
                    color: #64748b;
                    font-size: 0.8rem;
                    margin-top: 16px;
                }
            `}</style>
        </div>
    );
}
