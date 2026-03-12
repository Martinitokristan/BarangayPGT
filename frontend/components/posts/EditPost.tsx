'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import UploadProgress from "@/components/ui/UploadProgress";
import api, { getStorageUrl } from "@/lib/api";
import {
    HiExclamation,
    HiCloudUpload,
    HiPhotograph,
    HiX,
    HiArrowLeft,
} from "react-icons/hi";

interface EditPostProps {
    postId: string;
}

export default function EditPost({ postId }: EditPostProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [form, setForm] = useState({
        title: "",
        description: "",
        purpose: "general",
        urgency_level: "low",
    });
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        try {
            const res = await api.get(`/posts/${postId}`);
            const post = res.data;

            if (user?.id !== post.user_id && user?.role !== "admin") {
                showToast("You don't have permission to edit this post.", "error");
                router.push("/");
                return;
            }

            setForm({
                title: post.title,
                description: post.description,
                purpose: post.purpose,
                urgency_level: post.urgency_level,
            });
            if (post.image) {
                setExistingImage(getStorageUrl(post.image));
            }
        } catch (e) {
            showToast("Failed to load post.", "error");
            router.push("/");
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast("Image must be less than 5MB", "error");
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setExistingImage(null);
            setRemoveImage(false);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
        setExistingImage(null);
        setRemoveImage(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        setUploadProgress(image ? 0 : null);

        try {
            const formData = new FormData();
            formData.append("_method", "PUT");
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("purpose", form.purpose);
            formData.append("urgency_level", form.urgency_level);
            if (image) formData.append("image", image);
            if (removeImage) formData.append("remove_image", "1");

            await api.post(`/posts/${postId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent: any) => {
                    if (progressEvent.total) {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total,
                        );
                        setUploadProgress(percent);
                    }
                },
            });

            showToast("Post updated successfully!", "success");
            router.push(`/posts/${postId}`);
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
                showToast("Please fix the errors in the form.", "error");
            } else {
                showToast(
                    err.response?.data?.message ||
                        "Failed to update post. Please try again.",
                    "error"
                );
            }
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };

    if (fetching) return <div className="loading-spinner">Loading post...</div>;

    return (
        <div className="create-post-container">
            <div className="create-post-card">
                <button
                    className="btn btn-sm btn-outline back-btn"
                    onClick={() => router.back()}
                    style={{ marginBottom: "1rem" }}
                >
                    <HiArrowLeft /> Back
                </button>

                <h2>Edit Post</h2>
                <p className="subtitle">Update your post details</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Brief title of your concern"
                            required
                        />
                        {errors.title && (
                            <span className="form-error">
                                {errors.title[0]}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={5}
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe the issue in detail..."
                            required
                        />
                        {errors.description && (
                            <span className="form-error">
                                {errors.description[0]}
                            </span>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="purpose">Purpose / Category</label>
                            <select
                                id="purpose"
                                name="purpose"
                                value={form.purpose}
                                onChange={handleChange}
                            >
                                <option value="complaint">Complaint</option>
                                <option value="problem">Problem</option>
                                <option value="emergency">Emergency</option>
                                <option value="suggestion">Suggestion</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="urgency_level">Urgency Level</label>
                            <select
                                id="urgency_level"
                                name="urgency_level"
                                value={form.urgency_level}
                                onChange={handleChange}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High - Urgent</option>
                            </select>
                        </div>
                    </div>

                    {form.urgency_level === "high" && (
                        <div className="alert alert-warning">
                            <HiExclamation /> This will be flagged as an urgent
                            post.
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="image">
                            <HiPhotograph /> Attach Image (optional)
                        </label>
                        <div className="file-upload-area">
                            <input
                                id="image"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/gif"
                                onChange={handleImageChange}
                                className="file-input-hidden"
                            />
                            {!imagePreview && !existingImage && (
                                <label
                                    htmlFor="image"
                                    className="file-upload-label"
                                >
                                    <HiCloudUpload />
                                    <span>
                                        Click to upload or drag an image
                                    </span>
                                    <small>JPEG, PNG, GIF up to 5MB</small>
                                </label>
                            )}
                        </div>
                        {(imagePreview || existingImage) && (
                            <div className="image-preview">
                                <img
                                    src={imagePreview || existingImage || ''}
                                    alt="Preview"
                                />
                                <button
                                    type="button"
                                    className="image-preview-remove"
                                    onClick={handleRemoveImage}
                                >
                                    <HiX /> Remove
                                </button>
                            </div>
                        )}
                    </div>

                    <UploadProgress progress={uploadProgress} />

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Updating..." : "Update Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
