import React, { useState } from "react";
import ReactDOM from "react-dom";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { FaTelegramPlane, FaPaperPlane } from "react-icons/fa";

const ModalContent = ({ user, phoneInfo, message, setMessage, loading, handleSendSms, setShowModal }) => (
    <div className="modal fade show d-block" style={{ 
        backgroundColor: 'rgba(28, 30, 33, 0.7)', 
        zIndex: 99999, 
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        padding: '16px'
    }}>
        <div className="modal-dialog m-0 w-100" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '28px', overflow: 'hidden' }}>
                <div className="modal-header border-0 pb-0 pt-4 px-4 justify-content-center">
                    <div className="d-flex align-items-center gap-2">
                        <FaTelegramPlane size={24} color="#0088cc" />
                        <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.2rem', color: '#1c1e21' }}>
                            Send Message
                        </h5>
                    </div>
                </div>
                
                <div className="modal-body p-4 text-center pb-3">
                    <div className="mb-4">
                        <h6 className="mb-1 fw-bold" style={{ fontSize: '1.05rem', color: '#1c1e21' }}>{user.name}</h6>
                        <span className="text-muted small" style={{ letterSpacing: '0.4px' }}>
                            {phoneInfo?.phone || user.phone}
                        </span>
                    </div>

                    <div className="text-start">
                        <textarea
                            className="form-control border-0"
                            style={{ 
                                borderRadius: '14px', 
                                resize: 'none',
                                padding: '12px 16px',
                                backgroundColor: '#f0f2f5',
                                fontSize: '15px',
                                minHeight: '44px',
                                maxHeight: '180px',
                                transition: 'height 0.1s ease'
                            }}
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = '44px';
                                e.target.style.height = Math.max(44, e.target.scrollHeight) + 'px';
                            }}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            maxLength={500}
                            required
                        />
                        <div className="d-flex justify-content-between align-items-center mt-2 px-1">
                            <span className="text-muted x-small" style={{ fontSize: '11px', fontWeight: '600', opacity: 0.7 }}>{message.length}/500</span>
                            {message.length > 450 && <span className="text-danger x-small" style={{ fontSize: '11px', fontWeight: '600' }}>Near limit</span>}
                        </div>
                    </div>
                </div>

                <div className="modal-footer border-0 p-4 pt-0 d-flex gap-3">
                    <button 
                        type="button" 
                        className="btn btn-link text-decoration-none flex-grow-1 py-3 fw-bold" 
                        style={{ color: '#65676b', fontSize: '15px' }}
                        onClick={() => setShowModal(false)}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2" 
                        style={{ borderRadius: '16px', height: '52px', fontWeight: '700', backgroundColor: '#0088cc', border: 'none', fontSize: '15px' }}
                        onClick={handleSendSms}
                        disabled={loading || !message.trim()}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                            "Send Now"
                        )}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default function AdminSmsButton({ user, isMeta = false }) {
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [phoneInfo, setPhoneInfo] = useState({ has_phone: !!user.phone });
    const toast = useToast();

    const handleShowModal = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowModal(true);
        fetchPhoneInfo();
    };

    const fetchPhoneInfo = async () => {
        try {
            const response = await api.get(`/admin/users/${user.id}/phone`);
            setPhoneInfo(response.data);
        } catch (error) {
            toast.error("Failed to fetch user phone information");
        }
    };

    const handleSendSms = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post(`/admin/users/${user.id}/send-sms`, {
                message: message.trim()
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setMessage("");
                setShowModal(false);
            } else {
                toast.error(response.data.error || "Failed to send SMS");
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to send SMS");
        } finally {
            setLoading(false);
        }
    };

    const renderButton = () => {
        if (isMeta) {
            return (
                <button 
                    className="meta-item sms-meta-btn"
                    onClick={handleShowModal}
                    title={`Send SMS to ${user.name}`}
                    disabled={!phoneInfo?.has_phone}
                >
                    <FaTelegramPlane />
                    <span>Send SMS</span>
                </button>
            );
        }

        return (
            <button 
                className="action-btn"
                onClick={handleShowModal}
                title={`Send SMS to ${user.name}`}
                style={!phoneInfo?.has_phone ? { opacity: 0.5, cursor: 'not-allowed' } : { background: 'linear-gradient(135deg, #0088cc, #00a2ed)', color: 'white', border: 'none' }}
                disabled={!phoneInfo?.has_phone}
            >
                <FaTelegramPlane />
            </button>
        );
    };

    return (
        <>
            {renderButton()}
            {showModal && ReactDOM.createPortal(
                <ModalContent 
                    user={user}
                    phoneInfo={phoneInfo}
                    message={message}
                    setMessage={setMessage}
                    loading={loading}
                    handleSendSms={handleSendSms}
                    setShowModal={setShowModal}
                />, 
                document.body
            )}
        </>
    );
}
