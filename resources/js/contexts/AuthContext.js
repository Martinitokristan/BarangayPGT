import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post("/login", { email, password });
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user);
        return response.data;
    };

    const register = async (data) => {
        const response = await api.post("/register", data);
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (e) {
            // ignore
        }
        localStorage.removeItem("token");
        setUser(null);
    };

    const value = {
        user,
        setUser,
        login,
        register,
        logout,
        loading,
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
