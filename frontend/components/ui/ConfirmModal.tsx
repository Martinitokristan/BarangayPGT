import React from "react";
import { HiExclamation, HiX } from "react-icons/hi";

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    variant,
}: any) {
    if (!isOpen) return null;

    const btnClass =
        variant === "danger" ? "btn btn-danger" : "btn btn-primary";

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onCancel}>
                    <HiX />
                </button>
                <div
                    className={`modal-icon modal-icon-${variant || "warning"}`}
                >
                    <HiExclamation />
                </div>
                <h3 className="modal-title">{title || "Are you sure?"}</h3>
                <p className="modal-message">
                    {message || "This action cannot be undone."}
                </p>
                <div className="modal-actions">
                    <button className="btn btn-outline" onClick={onCancel}>
                        {cancelText || "Cancel"}
                    </button>
                    <button className={btnClass} onClick={onConfirm}>
                        {confirmText || "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}
