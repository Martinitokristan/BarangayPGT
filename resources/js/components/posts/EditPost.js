import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import UploadProgress from "../ui/UploadProgress";
import api from "../../services/api";
import {
    HiExclamation,
    HiCloudUpload,
    HiPhotograph,
    HiX,
    HiArrowLeft,
} from "react-icons/hi";

export default function EditPost() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [form, setForm] = useState({
        title: "",
        description: "",
        purpose: "general",
        urgency_level: "low",
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [existingImage, setExistingImage] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(null);

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        try {
            const res = await api.get(`/posts/${id}`);
            const post = res.data;

            // Check if the user owns this post or is admin
            if (user?.id !== post.user_id && user?.role !== "admin") {
                toast.error("You don't have permission to edit this post.");
                navigate("/");
                return;
            }

            setForm({
                title: post.title,
                description: post.description,
                purpose: post.purpose,
                urgency_level: post.urgency_level,
            });
            if (post.image) {
                setExistingImage(`/storage/${post.image}`);
            }
        } catch (e) {
            toast.error("Failed to load post.");
            navigate("/");
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be less than 5MB");
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

    const handleSubmit = async (e) => {
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

            await api.post(`/posts/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total,
                    );
                    setUploadProgress(percent);
                },
            });

            toast.success("Post updated successfully!");
            navigate(`/posts/${id}`);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
                toast.error("Please fix the errors in the form.");
            } else {
                toast.error(
                    err.response?.data?.message ||
                        "Failed to update post. Please try again.",
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
                    onClick={() => navigate(-1)}
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
                                    src={imagePreview || existingImage}
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
                            onClick={() => navigate(-1)}
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
