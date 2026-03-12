import EditPost from '@/components/posts/EditPost';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditPostRoute({ params }: Props) {
    const { id } = await params;
    return <EditPost postId={id} />;
}
