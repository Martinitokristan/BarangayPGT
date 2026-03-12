import React from "react";
import { FaCalendar, FaMapMarkerAlt, FaClock, FaTimes } from "react-icons/fa";
import { format } from "date-fns";

export default function EventCard({ event, onClick, isAdmin, onEdit, onDelete }) {
    const formattedDate = event.event_date ? format(new Date(event.event_date), "MMM d, yyyy") : "";
    const formattedTime = event.event_date ? format(new Date(event.event_date), "h:mm a") : "";

    const handleActionClick = (e, callback) => {
        e.stopPropagation();
        callback(event);
    };

    return (
        <div className="event-card" onClick={onClick}>
            {event.image && (isAdmin && onDelete && (
                <button 
                    className="delete-event-badge" 
                    onClick={(e) => handleActionClick(e, onDelete)}
                    title="Delete Event"
                >
                    <FaTimes />
                </button>
            )) || event.image && (
                <div className="event-image">
                    <img src={event.image} alt={event.title} />
                </div>
            )}
            {!event.image && isAdmin && onDelete && (
                 <button 
                    className="delete-event-badge floating" 
                    onClick={(e) => handleActionClick(e, onDelete)}
                    title="Delete Event"
                >
                    <FaTimes />
                </button>
            )}
            <div className="event-content">
                <h3 className="event-title">{event.title}</h3>
                
                <p className="event-description-snippet">
                    {event.description.length > 150
                        ? event.description.substring(0, 150) + "..."
                        : event.description}
                </p>

                <div className="event-meta">
                    <div className="meta-group">
                        <div className="meta-item">
                            <FaCalendar className="meta-icon date" />
                            <span className="meta-text">{formattedDate}</span>
                        </div>
                        <div className="meta-item">
                            <FaClock className="meta-icon time" />
                            <span className="meta-text">{formattedTime}</span>
                        </div>
                    </div>
                    <div className="meta-item location">
                        <FaMapMarkerAlt className="meta-icon spot" />
                        <span className="meta-text">{event.location}</span>
                    </div>
                </div>

                <div className="event-card-actions">
                    <button className="action-btn secondary" onClick={onClick}>View Details</button>
                    {isAdmin ? (
                        <button 
                            className="action-btn primary edit" 
                            onClick={(e) => handleActionClick(e, onEdit)}
                        >
                            Edit Event
                        </button>
                    ) : (
                        <button className="action-btn primary">I'm Interested</button>
                    )}
                </div>
            </div>
        </div>
    );
}
