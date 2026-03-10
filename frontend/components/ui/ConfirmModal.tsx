'use client';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen, title, message, confirmText, cancelText, variant = 'warning', onConfirm, onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl
          ${variant === 'danger' ? 'bg-red-100 text-red-600' : ''}
          ${variant === 'warning' ? 'bg-amber-100 text-amber-600' : ''}
          ${variant === 'primary' ? 'bg-blue-100 text-blue-600' : ''}
        `}>
                    {variant === 'danger' ? '🗑️' : variant === 'warning' ? '⚠️' : 'ℹ️'}
                </div>

                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                    {title || 'Are you sure?'}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                    {message || 'This action cannot be undone.'}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                    >
                        {cancelText || 'Cancel'}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 px-4 font-semibold rounded-xl transition-colors text-sm text-white
              ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}
              ${variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : ''}
              ${variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            `}
                    >
                        {confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
