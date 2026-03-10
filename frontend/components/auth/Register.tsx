'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    barangay_id: string;
    address: string;
    purok_address: string;
    sex: string;
    birth_date: string;
}

export default function Register() {
    const { showToast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const [barangays, setBarangays] = useState<Array<{ id: number; name: string }>>([]);
    const [barangaysLoaded, setBL] = useState(false);
    const [step, setStep] = useState<'form' | 'verify-email'>('form');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<RegisterForm>({
        name: '', email: '', password: '', confirmPassword: '',
        phone: '', barangay_id: '', address: '', purok_address: '', sex: '', birth_date: '',
    });

    const loadBarangays = async () => {
        if (barangaysLoaded) return;
        try {
            const res = await api.get('/barangays');
            setBarangays(res.data);
            setBL(true);
        } catch { /* ignore */ }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Supabase Auth user
            const { data, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: { name: form.name }, // stored in user_metadata
                    emailRedirectTo: `${window.location.origin}/`,
                },
            });

            if (error) throw error;

            const supabaseUid = data.user?.id;

            // 2. Create local Laravel user record
            await api.post('/auth/register', {
                supabase_uid: supabaseUid,
                name: form.name,
                email: form.email,
                phone: form.phone,
                barangay_id: form.barangay_id || null,
                address: form.address,
                purok_address: form.purok_address,
                sex: form.sex,
                birth_date: form.birth_date || null,
            });

            setStep('verify-email');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'verify-email') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="text-5xl mb-4">📧</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                    <p className="text-gray-500">
                        We sent a verification link to <strong>{form.email}</strong>.
                        Click the link to verify your email, then wait for admin approval.
                    </p>
                    <Link href="/login" className="inline-block mt-6 text-blue-600 hover:underline text-sm font-medium">
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4 shadow-lg">B</div>
                    <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                    <p className="text-gray-500 mt-1">Join the BarangayPGT community</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input name="name" required value={form.name} onChange={handleChange}
                                    placeholder="Juan Dela Cruz"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input name="email" type="email" required value={form.email} onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input name="password" type="password" required value={form.password} onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                        </div>

                        {/* Profile info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input name="phone" value={form.phone} onChange={handleChange}
                                    placeholder="09XXXXXXXXX"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                                <select name="sex" value={form.sex} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                                    <option value="">Select...</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                                <input name="birth_date" type="date" value={form.birth_date} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                                <select name="barangay_id" value={form.barangay_id} onChange={handleChange}
                                    onFocus={loadBarangays}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                                    <option value="">Select barangay...</option>
                                    {barangays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                                <input name="address" value={form.address} onChange={handleChange}
                                    placeholder="House No., Street, Barangay"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Purok / Zone</label>
                                <input name="purok_address" value={form.purok_address} onChange={handleChange}
                                    placeholder="Purok 1, Zone A"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-sm mt-2"
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
