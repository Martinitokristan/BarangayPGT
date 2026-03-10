'use client';

interface EventData {
    id: number;
    title: string;
    description: string;
    location: string;
    event_date: string;
    image?: string | null;
}

interface EventCardProps {
    event: EventData;
    isAdmin: boolean;
    onClick: () => void;
    onEdit: (event: EventData) => void;
    onDelete: (event: EventData) => void;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export type { EventData };

export default function EventCard({ event, isAdmin, onClick, onEdit, onDelete }: EventCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}>
            {event.image && (
                <div className="relative h-40 overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    {isAdmin && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(event); }}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors"
                            title="Delete"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}
            {!event.image && isAdmin && (
                <div className="h-1 bg-blue-600" />
            )}

            <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">{event.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {event.description.length > 120 ? event.description.slice(0, 120) + '...' : event.description}
                </p>

                <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                        <span>📅</span><span>{formatDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>🕐</span><span>{formatTime(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>📍</span><span>{event.location}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={onClick}
                        className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors">
                        View Details
                    </button>
                    {isAdmin ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                            className="flex-1 py-2 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 transition-colors">
                            Edit Event
                        </button>
                    ) : (
                        <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 transition-colors">
                            I'm Interested
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
