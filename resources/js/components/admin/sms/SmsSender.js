import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useToast } from "../../../contexts/ToastContext";
import { FaPaperPlane, FaHistory, FaSms, FaUser, FaClock, FaCheckCircle, FaExclamationCircle, FaPhone } from "react-icons/fa";

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
            toast.error("Failed to load SMS logs");
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
                fetchLogs();
            } else {
                toast.error(res.data.error || "Failed to send SMS.");
                fetchLogs();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send SMS.");
            fetchLogs();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sms-sender-module">
            <div className="card p-4">
                <h3><FaPaperPlane /> Send SMS Message</h3>
                <form onSubmit={handleSend} className="sms-form">
                    <div className="form-group">
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
                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            className="form-control"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Type your message here..."
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : <><FaPaperPlane /> Send SMS</>}
                    </button>
                </form>
            </div>

            <div className="card p-4">
                <h3><FaHistory /> SMS Logs</h3>
                <div className="logs-container">
                    {loadingLogs ? (
                        <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                            Loading logs...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <FaSms size={48} className="mb-3 opacity-25" />
                            <p>No SMS logs found in your history.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View: Refined Table */}
                            <div className="desktop-logs table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Recipient</th>
                                            <th>Message</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id}>
                                                <td>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {new Date(log.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div style={{ fontWeight: '600' }}>
                                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '700' }}>{log.recipient_phone}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        Sent by: {log.admin?.name || "System"}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="log-msg-preview" title={log.message_content}>
                                                        {log.message_content}
                                                    </div>
                                                </td>
                                                <td>
                                                    {log.status === 'sent' ? (
                                                        <span className="badge bg-success"><FaCheckCircle className="me-1" /> Sent</span>
                                                    ) : (
                                                        <span className="badge bg-danger" title={log.error_message}><FaExclamationCircle className="me-1" /> Failed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View: Card-based List */}
                            <div className="mobile-logs">
                                {logs.map((log) => (
                                    <div key={log.id} className="sms-log-card">
                                        <div className="card-header-row">
                                            <div className="log-date">
                                                <FaClock /> {new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                            {log.status === 'sent' ? (
                                                <span className="badge bg-success">Sent</span>
                                            ) : (
                                                <span className="badge bg-danger">Failed</span>
                                            )}
                                        </div>
                                        <div className="card-main-info">
                                            <div className="info-item">
                                                <label><FaPhone size={10} /> Recipient</label>
                                                <span>{log.recipient_phone}</span>
                                            </div>
                                            <div className="info-item">
                                                <label><FaUser size={10} /> Admin</label>
                                                <span>{log.admin?.name || "System"}</span>
                                            </div>
                                        </div>
                                        <div className="card-msg-box">
                                            <label>Message Content</label>
                                            <p>{log.message_content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
