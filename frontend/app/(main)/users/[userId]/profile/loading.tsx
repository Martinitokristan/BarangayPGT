// Loading skeleton for User Profile page
export default function Loading() {
    return (
        <div className="feed-loading-skeleton">
            {/* Cover skeleton */}
            <div className="skeleton-card" style={{ height: '200px', borderRadius: '0 0 16px 16px', marginBottom: 0 }} />
            {/* Profile info skeleton */}
            <div className="skeleton-card" style={{ marginTop: '-40px', paddingTop: '60px' }}>
                <div className="skeleton-header" style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="skeleton-avatar" style={{ width: '80px', height: '80px' }} />
                    <div className="skeleton-line short" style={{ marginTop: '12px' }} />
                    <div className="skeleton-line shorter" />
                </div>
            </div>
        </div>
    );
}
