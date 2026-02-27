import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import EventCard from "./EventCard";
import CreateEvent from "./CreateEvent";
import { FaPlus, FaCalendarAlt, FaTimes, FaMapMarkerAlt, FaClock, FaCalendar } from "react-icons/fa";

export default function EventList() {
    const { isAdmin } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const toast = useToast();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get("/events");
            setEvents(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch events");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setShowCreateModal(true);
    };

    const handleDelete = async (event) => {
        if (!window.confirm(`Are you sure you want to delete "${event.title}"?`)) return;
        
        try {
            await api.delete(`/events/${event.id}`);
            toast.success("Event deleted successfully");
            fetchEvents();
        } catch (error) {
            toast.error("Failed to delete event");
        }
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setEditingEvent(null);
    };

    if (loading) {
        return (
            <div className="events-loading">
                <div className="spinner"></div>
                <p>Loading events...</p>
            </div>
        );
    }

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

            {events.length === 0 ? (
                <div className="empty-events">
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
                                            <span>{format(new Date(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}</span>
                                        </div>
                                    </div>
                                    <div className="detail-meta-item">
                                        <FaClock className="meta-icon time" />
                                        <div className="meta-info">
                                            <label>Time</label>
                                            <span>{format(new Date(selectedEvent.event_date), "h:mm a")}</span>
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
                        fetchEvents();
                    }}
                />
            )}
        </div>
    );
}
