'use client';

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import EventCard from "@/components/events/EventCard";
import CreateEvent from "@/components/events/CreateEvent";
import { FaPlus, FaCalendarAlt, FaTimes, FaMapMarkerAlt, FaClock, FaCalendar } from "react-icons/fa";

interface EventListClientProps {
    initialEvents: any[];
}

export default function EventListClient({ initialEvents }: EventListClientProps) {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === "admin";

    // Start with initial data if any, otherwise show loading
    const [events, setEvents] = useState<any[]>(initialEvents);
    const [loading, setLoading] = useState(initialEvents.length === 0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const { showToast } = useToast();

    useEffect(() => {
        // Always fetch on mount — pure client-side fetching
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await api.get("/events");
            setEvents(res.data.data || res.data); // Adjusting based on api response shape
        } catch (error) {
            showToast("Failed to fetch events", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (event: any) => {
        setEditingEvent(event);
        setShowCreateModal(true);
    };

    const handleDelete = async (event: any) => {
        if (!window.confirm(`Are you sure you want to delete "${event.title}"?`)) return;

        try {
            await api.delete(`/events/${event.id}`);
            showToast("Event deleted successfully", "success");
            fetchEvents();
        } catch (error) {
            showToast("Failed to delete event", "error");
        }
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setEditingEvent(null);
    };

    return (
        <div className="events-container">
            <div className="events-header">
                <div className="header-title">
                    <FaCalendarAlt className="header-icon" />
                    <h1>Barangay Events</h1>
                </div>
                {isAdmin && (
                    <button className="create-event-btn" onClick={() => setShowCreateModal(true)}>
                        <FaPlus /> Post New Event
                    </button>
                )}
            </div>

            {loading && events.length === 0 ? (
                <div className="events-loading">
                    <div className="spinner"></div>
                    <p>Loading events...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="empty-events" style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p>No upcoming events found for your barangay.</p>
                </div>
            ) : (
                <div className="events-grid">
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            isAdmin={isAdmin}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onClick={() => setSelectedEvent(event)}
                        />
                    ))}
                </div>
            )}

            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="modal-content event-modal detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Event Details</h2>
                            <button className="close-btn" onClick={() => setSelectedEvent(null)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="event-detail-body">
                            {selectedEvent.image && (
                                <div className="detail-image">
                                    <img src={selectedEvent.image} alt={selectedEvent.title} />
                                </div>
                            )}
                            <div className="detail-content">
                                <h1 className="detail-title">{selectedEvent.title}</h1>

                                <div className="detail-meta-grid">
                                    <div className="detail-meta-item">
                                        <FaCalendar className="meta-icon date" />
                                        <div className="meta-info">
                                            <label>Date</label>
                                            <span>{selectedEvent.event_date ? format(new Date(selectedEvent.event_date), "EEEE, MMMM d, yyyy") : 'TBA'}</span>
                                        </div>
                                    </div>
                                    <div className="detail-meta-item">
                                        <FaClock className="meta-icon time" />
                                        <div className="meta-info">
                                            <label>Time</label>
                                            <span>{selectedEvent.event_date ? format(new Date(selectedEvent.event_date), "h:mm a") : 'TBA'}</span>
                                        </div>
                                    </div>
                                    <div className="detail-meta-item wide">
                                        <FaMapMarkerAlt className="meta-icon spot" />
                                        <div className="meta-info">
                                            <label>Location</label>
                                            <span>{selectedEvent.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-description">
                                    <label>About this event</label>
                                    <p>{selectedEvent.description}</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            {isAdmin ? (
                                <button className="btn-primary" onClick={() => handleEdit(selectedEvent)}>
                                    Edit This Event
                                </button>
                            ) : (
                                <button className="btn-primary">Interested</button>
                            )}
                            <button className="btn-secondary" onClick={() => setSelectedEvent(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreateEvent
                    event={editingEvent}
                    onClose={handleCloseModal}
                    onSuccess={() => {
                        handleCloseModal();
                        fetchEvents(); // Background refresh after edit/create
                    }}
                />
            )}
        </div>
    );
}
