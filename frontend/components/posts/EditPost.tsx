'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import UploadProgress from '@/components/ui/UploadProgress';

const INPUT_CLASS = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function EditPost() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [form, setForm] = useState({ title: '', description: '', purpose: 'general', urgency_level: 'low' });
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                const post = res.data;
                if (user?.id !== post.user_id && user?.role !== 'admin') {
                    showToast("You don't have permission to edit this post.", 'error');
                    router.push('/'); return;
                }
                setForm({ title: post.title, description: post.description, purpose: post.purpose, urgency_level: post.urgency_level });
                if (post.image) setExistingImage(post.image.startsWith('http') ? post.image : `/storage/${post.image}`);
            } catch { showToast('Failed to load post.', 'error'); router.push('/'); }
            finally { setFetching(false); }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Image must be less than 5MB', 'error'); return; }
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        setExistingImage(null);
        setRemoveImage(false);
    };

    const handleRemoveImage = () => {
        setImage(null); setImagePreview(null); setExistingImage(null); setRemoveImage(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        setUploadProgress(image ? 0 : null);

        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append('title', form.title);
            fd.append('description', form.description);
            fd.append('purpose', form.purpose);
            fd.append('urgency_level', form.urgency_level);
            if (image) fd.append('image', image);
            if (removeImage) fd.append('remove_image', '1');

            await api.post(`/posts/${id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (ev: any) =>
                    setUploadProgress(ev.total ? Math.round((ev.loaded * 100) / ev.total) : 100),
            });

            showToast('Post updated successfully!', 'success');
            router.push(`/posts/${id}`);
        } catch (err: any) {
            if (err.response?.data?.errors) { setErrors(err.response.data.errors); showToast('Please fix the errors.', 'error'); }
            else showToast(err.response?.data?.message ?? 'Failed to update post.', 'error');
        } finally { setLoading(false); setUploadProgress(null); }
    };

    if (fetching) return <div className="text-center py-12 text-gray-400">Loading post...</div>;

    const currentImage = imagePreview ?? existingImage;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Post</h1>
                <p className="text-sm text-gray-500 mb-6">Update your post details</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className={LABEL_CLASS} htmlFor="title">Title</label>
                        <input id="title" name="title" type="text" value={form.title} onChange={handleChange} required
                            placeholder="Brief title of your concern"
                            className={`${INPUT_CLASS} ${errors.title ? 'border-red-400' : ''}`} />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
                    </div>

                    <div>
                        <label className={LABEL_CLASS} htmlFor="description">Description</label>
                        <textarea id="description" name="description" rows={5} value={form.description} onChange={handleChange} required
                            placeholder="Describe the issue in detail..."
                            className={`${INPUT_CLASS} resize-none ${errors.description ? 'border-red-400' : ''}`} />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description[0]}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS} htmlFor="purpose">Purpose / Category</label>
                            <select id="purpose" name="purpose" value={form.purpose} onChange={handleChange} className={INPUT_CLASS}>
                                <option value="complaint">📋 Complaint</option>
                                <option value="problem">❗ Problem</option>
                                <option value="emergency">🚨 Emergency</option>
                                <option value="suggestion">💡 Suggestion</option>
                                <option value="general">📢 General</option>
                            </select>
                        </div>
                        <div>
                            <label className={LABEL_CLASS} htmlFor="urgency_level">Urgency Level</label>
                            <select id="urgency_level" name="urgency_level" value={form.urgency_level} onChange={handleChange} className={INPUT_CLASS}>
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High – Urgent</option>
                            </select>
                        </div>
                    </div>

                    {form.urgency_level === 'high' && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                            🚨 This will be flagged as an urgent post.
                        </div>
                    )}

                    <div>
                        <label className={LABEL_CLASS}>📷 Attach Image <span className="text-gray-400 font-normal">(optional)</span></label>
                        {currentImage ? (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                <img src={currentImage} alt="Preview" className="w-full max-h-64 object-cover" />
                                <button type="button" onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors">
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="image"
                                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                <span className="text-2xl mb-2">☁️</span>
                                <span className="text-sm font-medium text-gray-600">Click to upload a new image</span>
                                <span className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF up to 5MB</span>
                            </label>
                        )}
                        <input id="image" type="file" accept="image/jpeg,image/png,image/jpg,image/gif"
                            onChange={handleImageChange} className="hidden" />
                    </div>

                    <UploadProgress progress={uploadProgress} />

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => router.back()}
                            className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
                            {loading ? 'Updating...' : 'Update Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
