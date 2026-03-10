'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import EventCard, { type EventData } from '@/components/events/EventCard';
import CreateEvent from '@/components/events/CreateEvent';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function EventList() {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();

    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreate] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventData | null>(null);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data.data);
        } catch { showToast('Failed to load events.', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchEvents(); }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/events/${deleteTarget.id}`);
            showToast('Event deleted.', 'success');
            fetchEvents();
        } catch { showToast('Failed to delete event.', 'error'); }
        setDeleteTarget(null);
    };

    const handleCloseModal = () => { setShowCreate(false); setEditingEvent(null); };

    if (loading) return (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Loading events...
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📅 Barangay Events</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Upcoming activities and announcements</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                    >
                        + Post Event
                    </button>
                )}
            </div>

            {events.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                    <div className="text-4xl mb-3">📅</div>
                    <h3 className="font-semibold text-gray-900 mb-1">No upcoming events</h3>
                    <p className="text-sm text-gray-400">Check back later for barangay activities.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} isAdmin={!!isAdmin}
                            onClick={() => setSelectedEvent(event)}
                            onEdit={(e) => { setEditingEvent(e); setShowCreate(true); }}
                            onDelete={(e) => setDeleteTarget(e)}
                        />
                    ))}
                </div>
            )}

            {/* Event detail modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}>
                        {selectedEvent.image && (
                            <div className="h-48 overflow-hidden">
                                <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h2>
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">📅 {new Date(selectedEvent.event_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                <div className="flex items-center gap-2">🕐 {new Date(selectedEvent.event_date).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                                <div className="flex items-center gap-2">📍 {selectedEvent.location}</div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed mb-6">{selectedEvent.description}</p>
                            <div className="flex gap-3">
                                {isAdmin ? (
                                    <button onClick={() => { setEditingEvent(selectedEvent); setShowCreate(true); setSelectedEvent(null); }}
                                        className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                                        Edit This Event
                                    </button>
                                ) : (
                                    <button className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                                        I'm Interested
                                    </button>
                                )}
                                <button onClick={() => setSelectedEvent(null)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit modal */}
            {showCreateModal && (
                <CreateEvent event={editingEvent} onClose={handleCloseModal}
                    onSuccess={() => { handleCloseModal(); fetchEvents(); }} />
            )}

            {/* Delete confirm */}
            <ConfirmModal isOpen={!!deleteTarget}
                title="Delete Event"
                message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
                confirmText="Delete" variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)} />
        </div>
    );
}
