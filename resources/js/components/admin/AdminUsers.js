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
                                <td>{user.barangay?.name || "N/A"}</td>
                                <td>
                                    {new Date(
                                        user.created_at,
                                    ).toLocaleDateString()}
                                </td>
                                <td>
                                    <div className="action-buttons">
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
