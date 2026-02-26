import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import Navbar from "./layout/Navbar";
import Login from "./auth/Login";
import Register from "./auth/Register";
import Feed from "./posts/Feed";
import PostDetail from "./posts/PostDetail";
import CreatePost from "./posts/CreatePost";
import EditPost from "./posts/EditPost";
import AdminDashboard from "./admin/AdminDashboard";
import AdminPosts from "./admin/AdminPosts";
import Notifications from "./notifications/Notifications";
import AdminLayout from "./layout/AdminLayout";

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen">Loading...</div>;
    return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth();
    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (!isAdmin) return <Navigate to="/" />;
    return children;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen">Loading...</div>;
    return !user ? children : <Navigate to="/" />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <GuestRoute>
                        <Register />
                    </GuestRoute>
                }
            />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Feed />
                    </PrivateRoute>
                }
            />
            <Route
                path="/posts/create"
                element={
                    <PrivateRoute>
                        <CreatePost />
                    </PrivateRoute>
                }
            />
            <Route
                path="/posts/:id"
                element={
                    <PrivateRoute>
                        <PostDetail />
                    </PrivateRoute>
                }
            />
            <Route
                path="/posts/:id/edit"
                element={
                    <PrivateRoute>
                        <EditPost />
                    </PrivateRoute>
                }
            />
            <Route
                path="/notifications"
                element={
                    <PrivateRoute>
                        <Notifications />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminDashboard />
                    </AdminRoute>
                }
            />
            <Route
                path="/admin/posts"
                element={
                    <AdminRoute>
                        <AdminPosts />
                    </AdminRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <ToastProvider>
                    <AppShell />
                </ToastProvider>
            </AuthProvider>
        </Router>
    );
}

function AppShell() {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();
    const isGuestPage =
        location.pathname === "/login" || location.pathname === "/register";

    if (loading) return <div className="loading-screen">Loading...</div>;

    // Admin users: sidebar layout on ALL pages
    if (user && isAdmin && !isGuestPage) {
        return (
            <AdminLayout>
                <AppRoutes />
            </AdminLayout>
        );
    }

    // Regular users: Navbar layout
    return (
        <div className="app-container">
            {user && !isGuestPage && <Navbar />}
            <main className={user && !isGuestPage ? "main-content" : ""}>
                <AppRoutes />
            </main>
        </div>
    );
}
