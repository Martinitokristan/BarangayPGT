import React, { useState } from "react";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { FaTimes, FaCamera } from "react-icons/fa";

export default function CreateEvent({ onClose, onSuccess, event = null }) {
    const isEditing = !!event;
    const [formData, setFormData] = useState({
        title: event?.title || "",
        description: event?.description || "",
        location: event?.location || "",
        event_date: event?.event_date ? event.event_date.substring(0, 16) : "",
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(event?.image || null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (image) data.append("image", image);
        
        // Laravel requirement for file uploads + PUT
        if (isEditing) {
            data.append("_method", "PUT");
        }

        try {
            const url = isEditing ? `/events/${event.id}` : "/events";
            await api.post(url, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success(isEditing ? "Event updated successfully!" : "Event posted successfully!");
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to save event");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content event-modal">
                <div className="modal-header">
                    <h2>{isEditing ? "Edit Event" : "Post New Event"}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="event-form">
                    <div className="form-group">
                        <label>Event Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter event title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            placeholder="Describe the event"
                            rows="4"
                        ></textarea>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder="Where is it happening?"
                            />
                        </div>
                        <div className="form-group">
                            <label>Date & Time</label>
                            <input
                                type="datetime-local"
                                name="event_date"
                                value={formData.event_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Event Banner (Optional)</label>
                        <div className="image-upload-wrapper">
                            <input
                                type="file"
                                id="event-image"
                                accept="image/*"
                                onChange={handleImageChange}
                                hidden
                            />
                            <label htmlFor="event-image" className="image-upload-label">
                                {preview ? (
                                    <div className="preview-container">
                                        <img src={preview} alt="Preview" />
                                        <div className="change-overlay">
                                            <FaCamera /> Change Photo
                                        </div>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <FaCamera />
                                        <span>Click to upload banner image</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (isEditing ? "Updating..." : "Posting...") : (isEditing ? "Update Event" : "Post Event")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
