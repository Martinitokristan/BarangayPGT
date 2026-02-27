import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useToast } from "../../../contexts/ToastContext";

export default function SmsSender() {
    const [to, setTo] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoadingLogs(true);
            const res = await api.get("/admin/sms/logs");
            setLogs(res.data.data || []);
        } catch (err) {
            console.error("Failed to load SMS logs", err);
            toast.error("Failed to load SMS statistics");
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/sms/send", { to, message });
            if (res.data.success) {
                toast.success("SMS sent successfully!");
                setTo("");
                setMessage("");
                fetchLogs(); // Reload logs after sending
            } else {
                toast.error(res.data.error || "Failed to send SMS.");
                fetchLogs(); // Reload to show failed step
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send SMS.");
            fetchLogs(); // Reload to show failed step
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sms-sender-module">
            <div className="card mb-4 p-4 shadow-sm border">
                <h3 className="mb-3">Send SMS Message</h3>
                <form onSubmit={handleSend}>
                    <div className="form-group mb-3">
                        <label>To (Phone Number)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="e.g. +639171234567"
                            required
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label>Message</label>
                        <textarea
                            className="form-control"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send SMS"}
                    </button>
                </form>
            </div>

            <div className="card p-4 shadow-sm border">
                <h3 className="mb-3">SMS Logs</h3>
                {loadingLogs ? (
                    <div className="text-center py-4">Loading logs...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-4 text-muted">No SMS logs found.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Admin</th>
                                    <th>Recipient</th>
                                    <th>Message</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.created_at).toLocaleString()}</td>
                                        <td>{log.admin?.name || "System"}</td>
                                        <td>{log.recipient_phone}</td>
                                        <td>
                                            <div style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={log.message_content}>
                                                {log.message_content}
                                            </div>
                                        </td>
                                        <td>
                                            {log.status === 'sent' ? (
                                                <span className="badge bg-success">Sent</span>
                                            ) : (
                                                <span className="badge bg-danger" title={log.error_message}>Failed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
