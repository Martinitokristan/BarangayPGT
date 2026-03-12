// ─── Pure Client Page ─────────────────────────────────────────────────────
// No server-side fetch → instant navigation.
// UserProfileClient handles its own data loading with useEffect + loading state.

import { Metadata } from 'next';
import UserProfileClient from '@/components/users/UserProfileClient';

export const metadata: Metadata = {
    title: 'User Profile | BarangayPGT',
    description: 'View user profile on BarangayPGT.',
};

interface Props {
    params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: Props) {
    const { userId } = await params;
    // No server-side fetch — UserProfileClient will fetch on mount via useEffect
    return <UserProfileClient initialData={null} userId={userId} />;
}
