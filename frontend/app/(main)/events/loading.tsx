// Loading skeleton for Events page
export default function Loading() {
    return (
        <div className="feed-loading-skeleton">
            <div className="skeleton-card" style={{ height: '60px', marginBottom: '1.5rem' }}>
                <div className="skeleton-line short" />
            </div>
            {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-body" style={{ height: '180px' }}>
                        <div className="skeleton-line" />
                        <div className="skeleton-line medium" />
                        <div className="skeleton-line short" />
                    </div>
                </div>
            ))}
        </div>
    );
}
