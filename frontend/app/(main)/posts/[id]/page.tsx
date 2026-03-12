// ─── Pure Client Page ─────────────────────────────────────────────────────
// No server-side fetch → instant navigation.
// PostDetailClient handles its own data loading with useEffect + loading state.

import { Metadata } from 'next';
import PostDetailClient from '@/components/posts/PostDetailClient';

export const metadata: Metadata = {
    title: 'Post | BarangayPGT',
    description: 'View community post on BarangayPGT.',
};

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: Props) {
    const { id } = await params;
    // No server-side fetch — PostDetailClient will fetch on mount via useEffect
    return <PostDetailClient initialPost={null} postId={id} />;
}
