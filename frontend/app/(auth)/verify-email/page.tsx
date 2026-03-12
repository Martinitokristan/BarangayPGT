'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { HiCheckCircle, HiXCircle } from "react-icons/hi";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { verifyAndLogin } = useAuth();
    const [status, setStatus] = useState("verifying");
    const [message, setMessage] = useState("Verifying your email securely...");

    useEffect(() => {
        const verify = async () => {
            const id = searchParams.get("id");
            const hash = searchParams.get("hash");
            const expires = searchParams.get("expires");
            const signature = searchParams.get("signature");

            if (!id || !hash || !expires || !signature) {
                setStatus("error");
                setMessage("Invalid or missing verification link parameters.");
                return;
            }

            try {
                const url = `/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`;
                const res = await api.get(url);
                setStatus("success");
                setMessage(
                    res.data.message ||
                    "Email verified! Setting up your account...",
                );

                // Use the returned token and user to login immediately
                verifyAndLogin(res.data.user, res.data.token);

                setTimeout(() => router.push("/"), 2000);
            } catch (err: any) {
                setStatus("error");
                setMessage(
                    err.response?.data?.message ||
                    "Verification failed. The link may have expired.",
                );
            }
        };

        verify();
    }, [searchParams, router, verifyAndLogin]);

    return (
        <div className="auth-container">
            <div className="auth-card text-center" style={{ padding: "40px" }}>
                {status === "verifying" && (
                    <div>
                        <h2>Verifying...</h2>
                        <p>{message}</p>
                    </div>
                )}
                {status === "success" && (
                    <div>
                        <HiCheckCircle
                            style={{
                                fontSize: "4rem",
                                color: "#10B981",
                                marginBottom: "15px",
                            }}
                        />
                        <h2>Success!</h2>
                        <p>{message}</p>
                        <p style={{ marginTop: "15px", color: "#6B7280" }}>
                            Redirecting...
                        </p>
                    </div>
                )}
                {status === "error" && (
                    <div>
                        <HiXCircle
                            style={{
                                fontSize: "4rem",
                                color: "#EF4444",
                                marginBottom: "15px",
                            }}
                        />
                        <h2>Verification Failed</h2>
                        <p>{message}</p>
                        <Link
                            href="/login"
                            className="btn btn-primary"
                            style={{
                                marginTop: "20px",
                                display: "inline-block",
                            }}
                        >
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmail() {
    return (
        <Suspense fallback={<div className="loading-screen">Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
