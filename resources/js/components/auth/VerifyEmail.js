import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { HiCheckCircle, HiXCircle } from "react-icons/hi";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { verifyAndLogin } = useAuth();
    const [status, setStatus] = useState("verifying");
    const [message, setMessage] = useState("Verifying your email securely...");

    useEffect(() => {
        const verify = async () => {
            const id = searchParams.get("id");
            const hash = searchParams.get("hash");
            const signature = searchParams.get("signature");

            if (!id || !hash || !signature) {
                setStatus("error");
                setMessage("Invalid or missing verification link parameters.");
                return;
            }

            try {
                const url = `/email/verify/${id}/${hash}?signature=${signature}`;
                const res = await api.get(url);
                setStatus("success");
                setMessage(res.data.message || "Email verified! Logging you in...");
                
                // Use the returned token and user to login immediately
                verifyAndLogin(res.data.user, res.data.token);
                
                setTimeout(() => navigate('/'), 2000);
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-card text-center" style={{ padding: '40px' }}>
                {status === "verifying" && (
                    <div>
                        <h2>Verifying...</h2>
                        <p>{message}</p>
                    </div>
                )}
                {status === "success" && (
                    <div>
                        <HiCheckCircle style={{ fontSize: '4rem', color: '#10B981', marginBottom: '15px' }} />
                        <h2>Success!</h2>
                        <p>{message}</p>
                        <p style={{ marginTop: '15px', color: '#6B7280' }}>Redirecting to your feed...</p>
                    </div>
                )}
                {status === "error" && (
                    <div>
                        <HiXCircle style={{ fontSize: '4rem', color: '#EF4444', marginBottom: '15px' }} />
                        <h2>Verification Failed</h2>
                        <p>{message}</p>
                        <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
