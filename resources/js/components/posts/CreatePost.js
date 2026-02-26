import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import UploadProgress from "../ui/UploadProgress";
import {
    HiExclamation,
    HiCloudUpload,
    HiPhotograph,
    HiX,
} from "react-icons/hi";

export default function CreatePost() {
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
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);

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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        setUploadProgress(image ? 0 : null);

        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("purpose", form.purpose);
            formData.append("urgency_level", form.urgency_level);
            if (image) formData.append("image", image);

            await api.post("/posts", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total,
                    );
                    setUploadProgress(percent);
                },
            });

            toast.success("Post created successfully!");
            navigate("/");
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
                toast.error("Please fix the errors in the form.");
            } else {
                toast.error(
                    err.response?.data?.message ||
                        "Failed to create post. Please try again.",
                );
            }
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };

    return (
        <div className="create-post-container">
            <div className="create-post-card">
                <h2>Create New Post</h2>
                <p className="subtitle">
                    Share a concern, report a problem, or post an emergency
                    alert
                </p>

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
                            post. Admins and residents will be notified
                            immediately.
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
                            {!imagePreview && (
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
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                                <button
                                    type="button"
                                    className="image-preview-remove"
                                    onClick={() => {
                                        setImage(null);
                                        setImagePreview(null);
                                    }}
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
                            onClick={() => navigate("/")}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Posting..." : "Submit Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
