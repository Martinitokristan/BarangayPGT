'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import UploadProgress from '@/components/ui/UploadProgress';

const INPUT_CLASS = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1.5';
const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`;

export default function CreatePost() {
    const router = useRouter();
    const { showToast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const [form, setForm] = useState({ title: '', description: '', purpose: 'general', urgency_level: 'low' });
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Image must be less than 5MB', 'error'); return; }
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const titleVal = (formRef.current?.querySelector<HTMLInputElement>('[name="title"]')?.value ?? form.title).trim();
        const descVal = (formRef.current?.querySelector<HTMLTextAreaElement>('[name="description"]')?.value ?? form.description).trim();
        const purposeVal = formRef.current?.querySelector<HTMLSelectElement>('[name="purpose"]')?.value ?? form.purpose;
        const urgencyVal = formRef.current?.querySelector<HTMLSelectElement>('[name="urgency_level"]')?.value ?? form.urgency_level;

        const errs: Record<string, string[]> = {};
        if (!titleVal) errs.title = ['Title is required.'];
        if (!descVal) errs.description = ['Description is required.'];
        if (Object.keys(errs).length > 0) { setErrors(errs); showToast('Please fill in required fields.', 'error'); return; }

        setErrors({});
        setLoading(true);
        setUploadProgress(image ? 0 : null);

        try {
            const fd = new FormData();
            fd.append('title', titleVal);
            fd.append('description', descVal);
            fd.append('purpose', purposeVal);
            fd.append('urgency_level', urgencyVal);
            if (image) fd.append('image', image);

            await api.post('/posts', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (ev: any) =>
                    setUploadProgress(ev.total ? Math.round((ev.loaded * 100) / ev.total) : 100),
            });

            showToast('Post created successfully!', 'success');
            router.push('/');
        } catch (err: any) {
            if (err.response?.data?.errors) { setErrors(err.response.data.errors); showToast('Please fix the errors.', 'error'); }
            else showToast(err.response?.data?.message ?? 'Failed to create post.', 'error');
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Post</h1>
                <p className="text-sm text-gray-500 mb-6">Share a concern, report a problem, or post an emergency alert</p>

                <form onSubmit={handleSubmit} ref={formRef} className="space-y-5">
                    <div>
                        <label className={LABEL_CLASS} htmlFor="title">Title</label>
                        <input id="title" name="title" type="text" value={form.title}
                            onChange={handleChange}
                            placeholder="Brief title of your concern"
                            className={`${INPUT_CLASS} ${errors.title ? 'border-red-400' : ''}`}
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
                    </div>

                    <div>
                        <label className={LABEL_CLASS} htmlFor="description">Description</label>
                        <textarea id="description" name="description" rows={5} value={form.description}
                            onChange={handleChange}
                            placeholder="Describe the issue in detail..."
                            className={`${INPUT_CLASS} resize-none ${errors.description ? 'border-red-400' : ''}`}
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description[0]}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS} htmlFor="purpose">Purpose / Category</label>
                            <select id="purpose" name="purpose" value={form.purpose} onChange={handleChange} className={SELECT_CLASS}>
                                <option value="complaint">📋 Complaint</option>
                                <option value="problem">❗ Problem</option>
                                <option value="emergency">🚨 Emergency</option>
                                <option value="suggestion">💡 Suggestion</option>
                                <option value="general">📢 General</option>
                            </select>
                        </div>
                        <div>
                            <label className={LABEL_CLASS} htmlFor="urgency_level">Urgency Level</label>
                            <select id="urgency_level" name="urgency_level" value={form.urgency_level} onChange={handleChange} className={SELECT_CLASS}>
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High – Urgent</option>
                            </select>
                        </div>
                    </div>

                    {form.urgency_level === 'high' && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                            <span>🚨</span>
                            <span>This will be flagged as an urgent post. Admins and residents will be notified immediately.</span>
                        </div>
                    )}

                    <div>
                        <label className={LABEL_CLASS}>📷 Attach Image <span className="text-gray-400 font-normal">(optional)</span></label>
                        {imagePreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                                <button type="button" onClick={() => { setImage(null); setImagePreview(null); }}
                                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors">
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="image"
                                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                <span className="text-2xl mb-2">☁️</span>
                                <span className="text-sm font-medium text-gray-600">Click to upload or drag an image</span>
                                <span className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF up to 5MB</span>
                            </label>
                        )}
                        <input id="image" type="file" accept="image/jpeg,image/png,image/jpg,image/gif"
                            onChange={handleImageChange} className="hidden" />
                    </div>

                    <UploadProgress progress={uploadProgress} />

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => router.push('/')}
                            className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
                            {loading ? 'Posting...' : 'Submit Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
