import React from "react";
import { HiCloudUpload } from "react-icons/hi";

export default function UploadProgress({ progress }: { progress: number | null | undefined }) {
    if (progress === null || progress === undefined) return null;

    return (
        <div className="upload-progress">
            <div className="upload-progress-header">
                <HiCloudUpload />
                <span>{progress < 100 ? "Uploading..." : "Processing..."}</span>
                <span className="upload-percent">{progress}%</span>
            </div>
            <div className="upload-progress-bar">
                <div
                    className="upload-progress-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
