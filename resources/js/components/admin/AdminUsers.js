import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import AdminSmsButton from "./AdminSmsButton";

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
        if (!window.confirm(`Are you sure you want to approve ${user.name}?`)) return;
        try {
            await api.post(`/admin/users/${user.id}/approve`);
            toast.success("User approved!");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to approve user");
        }
    };

    const handleReject = async (user) => {
        if (!window.confirm(`Are you sure you want to reject and delete ${user.name}?`)) return;
        try {
            await api.delete(`/admin/users/${user.id}/reject`);
            toast.success("User rejected and removed.");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to reject user");
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading users...</div>;
    }

    return (
        <div className="admin-users">
            <div className="admin-header">
                <h2>Users Management</h2>

                {/* Filters */}
                <div className="filters">
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
                            setFilters({ ...filters, is_approved: e.target.value })
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
                        {barangays.map((barangay) => (
                            <option key={barangay.id} value={barangay.id}>
                                {barangay.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="users-table">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>IDs</th>
                            <th>Barangay</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-info">
                                        {user.avatar && (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="user-avatar"
                                            />
                                        )}
                                        <span>{user.name}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    {user.phone ? (
                                        <span className="phone-number">
                                            {user.phone.startsWith("+")
                                                ? user.phone
                                                : `+63${user.phone.slice(1)}`}
                                        </span>
                                    ) : (
                                        <span className="text-muted">
                                            No phone
                                        </span>
                                    )}
                                </td>
                                <td>
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
                                </td>
                                <td>
                                    {user.is_approved ? (
                                        <span className="badge badge-success">Approved</span>
                                    ) : (
                                        <span className="badge badge-warning">Pending</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {user.id_front_path && (
                                            <a href={`/storage/${user.id_front_path}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem' }}>Front</a>
                                        )}
                                        {user.id_back_path && (
                                            <a href={`/storage/${user.id_back_path}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem' }}>Back</a>
                                        )}
                                    </div>
                                </td>
                                <td>{user.barangay?.name || "N/A"}</td>
                                <td>
                                    {new Date(
                                        user.created_at,
                                    ).toLocaleDateString()}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        {!user.is_approved && (
                                            <>
                                                <button className="btn btn-sm btn-primary" onClick={() => handleApprove(user)}>Approve</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleReject(user)}>Reject</button>
                                            </>
                                        )}
                                        <AdminSmsButton user={user} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="empty-state">
                        No users found matching the filters.
                    </div>
                )}
            </div>
        </div>
    );
}
