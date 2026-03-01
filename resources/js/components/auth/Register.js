import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    HiCalendar,
    HiHome,
} from "react-icons/hi";

const TARGET_BARANGAY_LABEL = "Barangay Pagatpatan";
const TARGET_BARANGAY_INPUT_VALUE = "Brgy. Pagatpatan";
const TARGET_BARANGAY_CANON = "pagatpatan";
const SEX_OPTIONS = [
    { label: "Select sex", value: "" },
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other / Prefer not to say", value: "other" },
];

const normalizeBarangayName = (value = "") =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\b(barangay|brgy|butuan|city)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

const calculateAge = (dateString) => {
    if (!dateString) return "";
    const birthDate = new Date(dateString);
    if (Number.isNaN(birthDate.getTime())) {
        return "";
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age -= 1;
    }

    return age >= 0 ? age : "";
};

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        barangay_id: "",
        phone: "",
        address: "",
        sex: "",
        birth_date: "",
        age: "",
        purok_address: "",
        id_front: null,
        id_back: null,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [barangayError, setBarangayError] = useState("");
    const [barangayLoading, setBarangayLoading] = useState(true);
    const birthDateMax = new Date().toISOString().split("T")[0];

    useEffect(() => {
        let isMounted = true;
        api.get("/barangays")
            .then((res) => {
                if (!isMounted) return;
                const list = Array.isArray(res.data) ? res.data : [];
                const match = list.find((barangay) => {
                    const normalizedName = normalizeBarangayName(
                        barangay?.name || "",
                    );
                    return (
                        normalizedName === TARGET_BARANGAY_CANON ||
                        normalizedName.includes(TARGET_BARANGAY_CANON)
                    );
                });

                if (match) {
                    setForm((prev) => ({
                        ...prev,
                        barangay_id: match.id,
                    }));
                    setBarangayError("");
                } else {
                    setBarangayError(
                        `${TARGET_BARANGAY_LABEL} is not available in the system. Please contact your administrator.`,
                    );
                }
            })
            .catch(() => {
                if (isMounted) {
                    setBarangayError(
                        "Unable to load the default barangay. Please refresh and try again.",
                    );
                }
            })
            .finally(() => {
                if (isMounted) {
                    setBarangayLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === "file") {
            setForm((prev) => ({ ...prev, [name]: files[0] }));
        } else if (name === "birth_date") {
            const computedAge = calculateAge(value);
            setForm((prev) => ({
                ...prev,
                birth_date: value,
                age: computedAge === "" ? "" : computedAge,
            }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) {
            return; // Guard against double submissions while request is in-flight
        }
        setErrors({});
        if (!form.barangay_id) {
            setErrors((prev) => ({
                ...prev,
                barangay_id: [
                    `We couldn\'t set ${TARGET_BARANGAY_LABEL}. Please refresh and try again.`,
                ],
            }));
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            const derivedAge = form.birth_date
                ? calculateAge(form.birth_date)
                : "";
            Object.keys(form).forEach((key) => {
                let value = form[key];
                if (key === "age" && derivedAge !== "") {
                    value = derivedAge;
                }
                if (value !== null && value !== "") {
                    formData.append(key, value);
                }
            });
            const result = await register(formData);
            // Registration successful — redirect to login with success message
            navigate("/login", {
                state: {
                    registrationSuccess:
                        result.message ||
                        "Registration successful! Please check your email to verify your account, then log in.",
                },
            });
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
                                <HiUser /> Name
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
                            <label htmlFor="sex">
                                <HiUser /> Sex
                            </label>
                            <select
                                id="sex"
                                name="sex"
                                value={form.sex}
                                onChange={handleChange}
                                required
                            >
                                {SEX_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.sex && (
                                <span className="form-error">
                                    {errors.sex[0]}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="birth_date">
                                <HiCalendar /> Birth Date
                            </label>
                            <input
                                id="birth_date"
                                name="birth_date"
                                type="date"
                                value={form.birth_date}
                                onChange={handleChange}
                                required
                                max={birthDateMax}
                            />
                            {errors.birth_date && (
                                <span className="form-error">
                                    {errors.birth_date[0]}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="age">
                                <HiUser /> Age
                            </label>
                            <input
                                id="age"
                                name="age"
                                type="number"
                                value={form.age}
                                readOnly
                                placeholder="Calculated from birth date"
                            />
                            <small style={{ color: "#6b7280" }}>
                                Age is calculated automatically from your birth
                                date.
                            </small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone">
                                <HiPhone /> Phone Number
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="09171234567"
                                required
                                inputMode="tel"
                            />
                            {errors.phone && (
                                <span className="form-error">
                                    {errors.phone[0]}
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
                                autoCapitalize="none"
                                autoCorrect="off"
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

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="purok_address">
                                <HiHome /> Purok Address (optional)
                            </label>
                            <input
                                id="purok_address"
                                name="purok_address"
                                type="text"
                                value={form.purok_address}
                                onChange={handleChange}
                                placeholder="e.g., Purok 5"
                            />
                            {errors.purok_address && (
                                <span className="form-error">
                                    {errors.purok_address[0]}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">
                                <HiLocationMarker /> Full Address (optional)
                            </label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                value={form.address}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="barangay_id">
                            <HiOfficeBuilding /> Barangay
                        </label>
                        <input
                            type="text"
                            value={TARGET_BARANGAY_INPUT_VALUE}
                            readOnly
                            style={{
                                background: "#f9fafb",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                padding: "0.75rem 1rem",
                                fontWeight: 600,
                                color: "#111827",
                            }}
                        />
                        <small style={{ color: "#6b7280" }}>
                            Registration is currently limited to residents of{" "}
                            {TARGET_BARANGAY_LABEL}.
                        </small>
                        <input
                            type="hidden"
                            name="barangay_id"
                            value={form.barangay_id}
                            readOnly
                        />
                        {barangayLoading && (
                            <small style={{ color: "#6b7280" }}>
                                Setting your barangay&hellip;
                            </small>
                        )}
                        {errors.barangay_id && (
                            <span className="form-error">
                                {errors.barangay_id[0]}
                            </span>
                        )}
                        {barangayError && !errors.barangay_id && (
                            <span className="form-error">{barangayError}</span>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="id_front">
                                <HiLocationMarker /> Upload ID (Front)
                            </label>
                            <input
                                id="id_front"
                                name="id_front"
                                type="file"
                                accept="image/*"
                                onChange={handleChange}
                                required
                            />
                            {errors.id_front && (
                                <span className="form-error">
                                    {errors.id_front[0]}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="id_back">
                                <HiLocationMarker /> Upload ID (Back)
                            </label>
                            <input
                                id="id_back"
                                name="id_back"
                                type="file"
                                accept="image/*"
                                onChange={handleChange}
                                required
                            />
                            {errors.id_back && (
                                <span className="form-error">
                                    {errors.id_back[0]}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading || !form.barangay_id}
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
