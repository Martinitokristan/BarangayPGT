import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

// Generate or retrieve a persistent device token for trusted device tracking
function getDeviceToken() {
    let token = localStorage.getItem("device_token");
    if (!token) {
        // Fallback for non-secure contexts (HTTP via IP) where crypto.randomUUID is unavailable
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            token = crypto.randomUUID();
        } else {
            token =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
        }
        localStorage.setItem("device_token", token);
    }
    return token;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deviceTrusted, setDeviceTrusted] = useState(false);
    const [pendingAuth, setPendingAuth] = useState(null); // { user, token, device_trusted }

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get("/user");
            setUser(response.data);
            const trusted = localStorage.getItem("device_trusted");
            setDeviceTrusted(trusted === "true");
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const deviceToken = getDeviceToken();
        const response = await api.post("/login", {
            email,
            password,
            device_token: deviceToken,
        });

        const { user: userData, token, device_trusted } = response.data;

        if (device_trusted) {
            // Trusted device — full login immediately
            localStorage.setItem("token", token);
            localStorage.setItem("device_trusted", "true");
            setUser(userData);
            setDeviceTrusted(true);
            setPendingAuth(null);
        } else {
            // Untrusted device — keep in pending state (The Guard)
            // Do NOT save token to localStorage or setUser yet
            setPendingAuth({ user: userData, token, device_trusted });
            setUser(null);
            setDeviceTrusted(false);
        }

        return response.data;
    };

    const register = async (data) => {
        const deviceToken = getDeviceToken();
        data.append("device_token", deviceToken);

        const response = await api.post("/register", data, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        // No token or user returned here — account is not created yet.
        // The user must verify their email OTP via /verify-registration first.
        return response.data;
    };

    const verifyAndLogin = (userData, token) => {
        localStorage.setItem("token", token);
        localStorage.setItem("device_trusted", "true");
        setUser(userData);
        setDeviceTrusted(true);
        setPendingAuth(null);
    };

    /**
     * Step 2 of registration: submit OTP, create the account, and auto-login.
     */
    const verifyRegistration = async (email, code) => {
        const response = await api.post("/register/verify", { email, code });
        const { user: userData, token } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("device_trusted", "true");
        setUser(userData);
        setDeviceTrusted(true);
        setPendingAuth(null);
        return response.data;
    };

    /**
     * Resend registration OTP to the given email.
     */
    const resendRegistrationOtp = async (email) => {
        const response = await api.post("/register/resend-otp", { email });
        return response.data;
    };

    const verifyCode = async (code) => {
        // Use user data and token from pendingAuth
        const targetAuth = pendingAuth;
        if (!targetAuth) throw new Error("No pending authentication found.");

        const response = await api.post(
            "/email/verify-code",
            {
                email: targetAuth.user.email,
                code,
            },
            {
                headers: { Authorization: `Bearer ${targetAuth.token}` },
            },
        );

        // Existing account on a new device — upgrade to full login
        verifyAndLogin(targetAuth.user, targetAuth.token);

        return response.data;
    };

    const resendCode = async () => {
        const targetEmail = user?.email || pendingAuth?.user?.email;
        const targetToken = localStorage.getItem("token") || pendingAuth?.token;

        if (!targetEmail) throw new Error("Email not found.");

        const response = await api.post(
            "/email/resend-code",
            {
                email: targetEmail,
            },
            {
                headers: targetToken
                    ? { Authorization: `Bearer ${targetToken}` }
                    : {},
            },
        );
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (e) {
            // ignore
        }
        localStorage.removeItem("token");
        localStorage.removeItem("device_trusted");
        setUser(null);
        setDeviceTrusted(false);
        setPendingAuth(null);
    };

    /**
     * Request a password reset link delivered via email or SMS.
     * @param {'email'|'phone'} method
     * @param {string} identifier  - email address or phone number
     */
    const forgotPassword = async (method, identifier) => {
        const response = await api.post("/forgot-password", {
            method,
            identifier,
        });
        return response.data;
    };

    /**
     * Consume a reset token and set a new password.
     * On success the API returns a fresh auth token; we persist it and
     * log the user in automatically (redirect to feed).
     */
    const resetPassword = async (
        token,
        email,
        password,
        passwordConfirmation,
    ) => {
        const deviceToken = getDeviceToken();
        const response = await api.post("/reset-password", {
            token,
            email,
            password,
            password_confirmation: passwordConfirmation,
            device_token: deviceToken,
        });

        const {
            user: userData,
            token: authToken,
            device_trusted,
        } = response.data;

        // Auto-login after successful reset
        localStorage.setItem("token", authToken);
        localStorage.setItem("device_trusted", String(device_trusted));
        setUser(userData);
        setDeviceTrusted(device_trusted);
        setPendingAuth(null);

        return response.data;
    };

    /**
     * Phone / OTP variant of resetPassword.
     * Sends `phone` instead of `email` so the backend resolves the user
     * via their registered phone number.
     */
    const resetPasswordOtp = async (
        phone,
        otp,
        password,
        passwordConfirmation,
    ) => {
        const deviceToken = getDeviceToken();
        const response = await api.post("/reset-password", {
            token: otp,
            phone,
            password,
            password_confirmation: passwordConfirmation,
            device_token: deviceToken,
        });

        const {
            user: userData,
            token: authToken,
            device_trusted,
        } = response.data;

        // Auto-login after successful reset
        localStorage.setItem("token", authToken);
        localStorage.setItem("device_trusted", String(device_trusted));
        setUser(userData);
        setDeviceTrusted(device_trusted);
        setPendingAuth(null);

        return response.data;
    };

    const updateProfile = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    const value = {
        user,
        setUser,
        updateProfile,
        login,
        register,
        verifyRegistration,
        resendRegistrationOtp,
        logout,
        forgotPassword,
        resetPassword,
        resetPasswordOtp,
        loading,
        deviceTrusted,
        pendingAuth,
        verifyCode,
        verifyAndLogin,
        resendCode,
        isAdmin: user?.role === "admin",
        isResident: user?.role === "resident",
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
