// Loading skeleton shown while the Server Component fetches data.
// This enables instant navigation — Next.js wraps the page in a
// Suspense boundary and streams this placeholder immediately.

export default function Loading() {
    return (
        <div className="feed-loading-skeleton">
            {/* Skeleton post cards */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-header">
                        <div className="skeleton-avatar" />
                        <div className="skeleton-lines">
                            <div className="skeleton-line short" />
                            <div className="skeleton-line shorter" />
                        </div>
                    </div>
                    <div className="skeleton-body">
                        <div className="skeleton-line" />
                        <div className="skeleton-line" />
                        <div className="skeleton-line medium" />
                    </div>
                </div>
            ))}
        </div>
    );
}
