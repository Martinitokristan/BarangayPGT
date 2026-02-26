import React, { createContext, useContext, useState, useCallback } from "react";
import {
    HiCheckCircle,
    HiExclamation,
    HiInformationCircle,
    HiXCircle,
    HiX,
} from "react-icons/hi";

const ToastContext = createContext(null);

let toastId = 0;

const ICONS = {
    success: <HiCheckCircle />,
    error: <HiXCircle />,
    warning: <HiExclamation />,
    info: <HiInformationCircle />,
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(
        (message, type = "success", duration = 4000) => {
            const id = ++toastId;
            setToasts((prev) => [...prev, { id, message, type }]);
            if (duration > 0) {
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== id));
                }, duration);
            }
            return id;
        },
        [],
    );

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (msg, dur) => addToast(msg, "success", dur),
        error: (msg, dur) => addToast(msg, "error", dur || 6000),
        warning: (msg, dur) => addToast(msg, "warning", dur),
        info: (msg, dur) => addToast(msg, "info", dur),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span className="toast-icon">{ICONS[t.type]}</span>
                        <span className="toast-message">{t.message}</span>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(t.id)}
                        >
                            <HiX />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
