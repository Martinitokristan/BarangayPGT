'use client';

interface UploadProgressProps {
    progress: number | null;
}

export default function UploadProgress({ progress }: UploadProgressProps) {
    if (progress === null || progress === undefined) return null;

    return (
        <div className="mt-3 bg-blue-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2 text-sm">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <span className="animate-upload-pulse">☁️</span>
                    <span>{progress < 100 ? 'Uploading...' : 'Processing...'}</span>
                </div>
                <span className="text-blue-700 font-semibold tabular-nums">{progress}%</span>
            </div>
            {/* Progress bar with shimmer overlay */}
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden relative">
                <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-800 rounded-full transition-all duration-300 relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                >
                    {/* Shimmer highlight */}
                    <span className="animate-upload-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
            </div>
        </div>
    );
}
