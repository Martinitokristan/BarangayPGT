import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import {
    HiCheckCircle,
    HiXCircle,
    HiIdentification,
    HiPhone,
    HiMail,
    HiLocationMarker,
    HiX,
} from "react-icons/hi";

export default function AdminUsers() {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: "",
        barangay_id: "",
        is_approved: "",
    });
    const [barangays, setBarangays] = useState([]);
    const [expandedUser, setExpandedUser] = useState(null);
    const [lightbox, setLightbox] = useState({
        open: false,
        src: "",
        label: "",
    });

    useEffect(() => {
        fetchUsers();
        fetchBarangays();
    }, [filters]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.role) params.append("role", filters.role);
            if (filters.barangay_id)
                params.append("barangay_id", filters.barangay_id);
            if (filters.is_approved)
                params.append("is_approved", filters.is_approved);

            const res = await api.get(`/admin/users?${params}`);
            setUsers(res.data.data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const fetchBarangays = async () => {
        try {
            const res = await api.get("/admin/barangays");
            setBarangays(res.data);
        } catch (error) {
            toast.error("Failed to load barangays");
        }
    };

    const handleRoleChange = async (user, newRole) => {
        try {
            await api.put(`/admin/users/${user.id}/role`, { role: newRole });
            toast.success(`User role updated to ${newRole}`);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update user role");
        }
    };

    const handleApprove = async (user) => {
        if (!window.confirm(`Are you sure you want to approve ${user.name}?`))
            return;
        try {
            await api.post(`/admin/users/${user.id}/approve`);
            toast.success("User approved!");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to approve user");
        }
    };

    const handleReject = async (user) => {
        if (
            !window.confirm(
                `Are you sure you want to reject and delete ${user.name}?`,
            )
        )
            return;
        try {
            await api.delete(`/admin/users/${user.id}/reject`);
            toast.success("User rejected and removed.");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to reject user");
        }
    };

    const formatPhone = (phone) => {
        if (!phone) return null;
        return phone.startsWith("+") ? phone : `+63${phone.slice(1)}`;
    };

    if (loading) {
        return <div className="loading-spinner">Loading users...</div>;
    }

    return (
        <div className="admin-users">
            <div className="admin-users__header">
                <h2>Users Management</h2>
                <div className="admin-users__filters">
                    <select
                        value={filters.role}
                        onChange={(e) =>
                            setFilters({ ...filters, role: e.target.value })
                        }
                        className="form-select"
                    >
                        <option value="">All Roles</option>
                        <option value="resident">Residents</option>
                        <option value="admin">Admins</option>
                    </select>

                    <select
                        value={filters.is_approved}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                is_approved: e.target.value,
                            })
                        }
                        className="form-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="1">Approved</option>
                        <option value="0">Pending</option>
                    </select>

                    <select
                        value={filters.barangay_id}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                barangay_id: e.target.value,
                            })
                        }
                        className="form-select"
                    >
                        <option value="">All Barangays</option>
                        {barangays.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Card list (mobile-first, works on all sizes) ── */}
            <div className="admin-users__list">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className={`user-card ${!user.is_approved ? "user-card--pending" : ""}`}
                    >
                        <div
                            className="user-card__top"
                            onClick={() =>
                                setExpandedUser(
                                    expandedUser === user.id ? null : user.id,
                                )
                            }
                        >
                            <div className="user-card__avatar">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} />
                                ) : (
                                    <span>
                                        {user.name?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="user-card__info">
                                <div className="user-card__name">
                                    {user.name}
                                </div>
                                <div className="user-card__email">
                                    {user.email}
                                </div>
                            </div>
                            <div className="user-card__status">
                                {user.is_approved ? (
                                    <span className="badge badge-success">
                                        Approved
                                    </span>
                                ) : (
                                    <span className="badge badge-warning">
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>

                        {expandedUser === user.id && (
                            <div className="user-card__details">
                                <div className="user-card__detail-row">
                                    <HiPhone className="user-card__icon" />
                                    <span>
                                        {formatPhone(user.phone) || "No phone"}
                                    </span>
                                </div>
                                <div className="user-card__detail-row">
                                    <HiLocationMarker className="user-card__icon" />
                                    <span>
                                        {user.barangay?.name || "N/A"}
                                        {user.purok_address
                                            ? ` — ${user.purok_address}`
                                            : ""}
                                    </span>
                                </div>
                                {user.address && (
                                    <div className="user-card__detail-row">
                                        <HiLocationMarker className="user-card__icon" />
                                        <span>{user.address}</span>
                                    </div>
                                )}
                                <div className="user-card__detail-row">
                                    <HiMail className="user-card__icon" />
                                    <span>
                                        Joined{" "}
                                        {new Date(
                                            user.created_at,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* ID photos */}
                                {(user.id_front_path || user.id_back_path) && (
                                    <div className="user-card__ids">
                                        <HiIdentification className="user-card__icon" />
                                        <div className="user-card__id-links">
                                            {user.id_front_path && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() =>
                                                        setLightbox({
                                                            open: true,
                                                            src: `/storage/${user.id_front_path}`,
                                                            label: `${user.name} — ID Front`,
                                                        })
                                                    }
                                                >
                                                    ID Front
                                                </button>
                                            )}
                                            {user.id_back_path && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() =>
                                                        setLightbox({
                                                            open: true,
                                                            src: `/storage/${user.id_back_path}`,
                                                            label: `${user.name} — ID Back`,
                                                        })
                                                    }
                                                >
                                                    ID Back
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Role */}
                                <div className="user-card__detail-row">
                                    <span className="user-card__label">
                                        Role:
                                    </span>
                                    <select
                                        value={user.role}
                                        onChange={(e) =>
                                            handleRoleChange(
                                                user,
                                                e.target.value,
                                            )
                                        }
                                        className="form-select form-select-sm"
                                    >
                                        <option value="resident">
                                            Resident
                                        </option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                {/* Actions */}
                                <div className="user-card__actions">
                                    {!user.is_approved && (
                                        <>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() =>
                                                    handleApprove(user)
                                                }
                                            >
                                                <HiCheckCircle /> Approve
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() =>
                                                    handleReject(user)
                                                }
                                            >
                                                <HiXCircle /> Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {users.length === 0 && (
                    <div className="empty-state">
                        No users found matching the filters.
                    </div>
                )}
            </div>

            {/* ── Photo Lightbox ── */}
            {lightbox.open && (
                <div
                    className="lightbox-overlay"
                    onClick={() =>
                        setLightbox({ open: false, src: "", label: "" })
                    }
                >
                    <div
                        className="lightbox-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="lightbox-close"
                            onClick={() =>
                                setLightbox({ open: false, src: "", label: "" })
                            }
                        >
                            <HiX />
                        </button>
                        <p className="lightbox-label">{lightbox.label}</p>
                        <img src={lightbox.src} alt={lightbox.label} />
                    </div>
                </div>
            )}
        </div>
    );
}
