import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { RiCommunityFill } from "react-icons/ri";
import {
    HiUser,
    HiMail,
    HiLockClosed,
    HiPhone,
    HiLocationMarker,
    HiOfficeBuilding,
} from "react-icons/hi";

export default function Register() {
    const { register } = useAuth();
    const [barangays, setBarangays] = useState([]);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        barangay_id: "",
        phone: "",
        address: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get("/barangays")
            .then((res) => setBarangays(res.data))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        try {
            await register(form);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({
                    general: [
                        err.response?.data?.message || "Registration failed.",
                    ],
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card auth-card-wide">
                <div className="auth-header">
                    <span className="auth-icon">
                        <RiCommunityFill />
                    </span>
                    <h1>Register as Resident</h1>
                    <p>
                        Create your account to participate in your barangay
                        community
                    </p>
                </div>

                {errors.general && (
                    <div className="alert alert-error">{errors.general[0]}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">
                                <HiUser /> Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Juan Dela Cruz"
                                required
                            />
                            {errors.name && (
                                <span className="form-error">
                                    {errors.name[0]}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">
                                <HiMail /> Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                            />
                            {errors.email && (
                                <span className="form-error">
                                    {errors.email[0]}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">
                                <HiLockClosed /> Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min 8 characters"
                                required
                            />
                            {errors.password && (
                                <span className="form-error">
                                    {errors.password[0]}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="password_confirmation">
                                <HiLockClosed /> Confirm Password
                            </label>
                            <input
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="barangay_id">
                            <HiOfficeBuilding /> Barangay
                        </label>
                        <select
                            id="barangay_id"
                            name="barangay_id"
                            value={form.barangay_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select your barangay</option>
                            {barangays.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        {errors.barangay_id && (
                            <span className="form-error">
                                {errors.barangay_id[0]}
                            </span>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone">
                                <HiPhone /> Phone Number (optional)
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="09171234567"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">
                                <HiLocationMarker /> Address (optional)
                            </label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="123 Main St"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{" "}
                        <Link to="/login">Sign in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
