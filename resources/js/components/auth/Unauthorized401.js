import React from "react";
import { useNavigate } from "react-router-dom";
import { MdBlock } from "react-icons/md";
import { HiArrowLeft } from "react-icons/hi";

/**
 * Unauthorized401
 *
 * Shown when a resident (or unauthenticated visitor) attempts to access
 * an /admin/... route directly. Renders a clear "401 Unauthorized" error
 * instead of silently redirecting, so the user understands access is denied.
 */
export default function Unauthorized401() {
    const navigate = useNavigate();

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: "center" }}>
                <div className="auth-header">
                    <span className="auth-icon" style={{ color: "#ef4444" }}>
                        <MdBlock />
                    </span>
                    <h1 style={{ color: "#ef4444" }}>401 Unauthorized</h1>
                    <p>You do not have permission to access this page.</p>
                </div>

                <div
                    className="alert alert-error"
                    style={{ textAlign: "left", marginBottom: "1.5rem" }}
                >
                    <strong>Access Denied.</strong> This area is restricted to
                    administrators only. If you believe this is an error, please
                    contact your barangay administrator.
                </div>

                <button
                    className="btn btn-primary btn-block"
                    onClick={() => navigate("/")}
                >
                    <HiArrowLeft style={{ marginRight: "6px" }} />
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
}
