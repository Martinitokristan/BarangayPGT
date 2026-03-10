'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import type { EventData } from './EventCard';

interface CreateEventProps {
    event?: EventData | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateEvent({ event = null, onClose, onSuccess }: CreateEventProps) {
    const isEditing = !!event;
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        title: event?.title ?? '',
        description: event?.description ?? '',
        location: event?.location ?? '',
        event_date: event?.event_date ? event.event_date.substring(0, 16) : '',
    });
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(event?.image ?? null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            (Object.keys(formData) as (keyof typeof formData)[]).forEach((k) => fd.append(k, formData[k]));
            if (image) fd.append('image', image);
            if (isEditing) fd.append('_method', 'PUT');

            await api.post(isEditing ? `/events/${event!.id}` : '/events', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast(isEditing ? 'Event updated!' : 'Event posted!', 'success');
            onSuccess();
        } catch (err: any) {
            showToast(err.response?.data?.error ?? 'Failed to save event.', 'error');
        } finally { setLoading(false); }
    };

    const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Event' : 'Post New Event'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required
                            placeholder="Enter event title" className={INPUT} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required
                            rows={4} placeholder="Describe the event" className={`${INPUT} resize-none`} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} required
                                placeholder="Where is it happening?" className={INPUT} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time</label>
                            <input type="datetime-local" name="event_date" value={formData.event_date} onChange={handleChange} required className={INPUT} />
                        </div>
                    </div>

                    {/* Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Banner <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <label htmlFor="event-image" className="block cursor-pointer">
                            {preview ? (
                                <div className="relative rounded-xl overflow-hidden border border-gray-200 h-40">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <span className="text-white font-medium text-sm">📷 Change Photo</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                    <span className="text-2xl">📷</span>
                                    <span className="text-sm text-gray-500">Click to upload banner image</span>
                                </div>
                            )}
                        </label>
                        <input type="file" id="event-image" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
                            {loading ? (isEditing ? 'Updating...' : 'Posting...') : (isEditing ? 'Update Event' : 'Post Event')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
