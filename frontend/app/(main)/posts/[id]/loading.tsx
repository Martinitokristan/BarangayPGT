// Loading skeleton for Post Detail page
export default function Loading() {
    return (
        <div className="feed-loading-skeleton">
            <div className="skeleton-card">
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
                    <div className="skeleton-line" />
                </div>
            </div>
        </div>
    );
}
