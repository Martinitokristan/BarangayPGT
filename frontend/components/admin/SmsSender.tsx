'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface SmsLog {
    id: number; recipient_phone: string; message_content: string;
    status: 'sent' | 'failed'; error_message?: string;
    admin?: { name: string }; created_at: string;
}

export default function AdminSmsPage() {
    const { showToast } = useToast();
    const [to, setTo] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await api.get('/admin/sms/logs');
            setLogs(res.data.data ?? []);
        } catch { showToast('Failed to load SMS logs.', 'error'); }
        finally { setLoadingLogs(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/sms/send', { to, message });
            if (res.data.success) {
                showToast('SMS sent successfully!', 'success');
                setTo(''); setMessage('');
                fetchLogs();
            } else {
                showToast(res.data.error ?? 'Failed to send SMS.', 'error');
                fetchLogs();
            }
        } catch (err: any) {
            showToast(err.response?.data?.error ?? 'Failed to send SMS.', 'error');
            fetchLogs();
        } finally { setLoading(false); }
    };

    const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">📱 SMS Broadcast</h1>

            {/* Send form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">✉️ Send SMS Message</h2>
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">To (Phone Number)</label>
                        <input type="text" value={to} onChange={(e) => setTo(e.target.value)}
                            placeholder="e.g. +639171234567" required className={INPUT} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                            rows={4} placeholder="Type your message here..." required
                            className={`${INPUT} resize-none`} maxLength={500} />
                        <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/500</p>
                    </div>
                    <button type="submit" disabled={loading || !message.trim() || !to.trim()}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
                        {loading ? 'Sending...' : '✈️ Send SMS'}
                    </button>
                </form>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">📋 SMS History</h2>
                {loadingLogs ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Loading logs...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        <div className="text-3xl mb-2">📭</div>
                        <p>No SMS logs found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div key={log.id} className="border border-gray-100 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">{log.recipient_phone}</p>
                                        <p className="text-xs text-gray-400">by {log.admin?.name ?? 'System'} · {new Date(log.created_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {log.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{log.message_content}</p>
                                {log.error_message && (
                                    <p className="text-xs text-red-500 mt-1">{log.error_message}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
