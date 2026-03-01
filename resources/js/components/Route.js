import React from "react";
import { createRoot } from "react-dom/client";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import Navbar from "./layout/Navbar";
import Login from "./auth/Login";
import Register from "./auth/Register";
import VerificationPending from "./auth/VerificationPending";
import OtpVerification from "./auth/OtpVerification";
import VerifyEmail from "./auth/VerifyEmail";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import ResetPasswordOtp from "./auth/ResetPasswordOtp";
import Unauthorized401 from "./auth/Unauthorized401";
import Feed from "./posts/Feed";
import PostDetail from "./posts/PostDetail";
import CreatePost from "./posts/CreatePost";
import EditPost from "./posts/EditPost";
import AdminDashboard from "./admin/AdminDashboard";
import AdminPosts from "./admin/AdminPosts";
import AdminUsers from "./admin/AdminUsers";
import SmsSender from "./admin/sms/SmsSender";
import Notifications from "./notifications/Notifications";
import UserProfile from "./users/UserProfile";
import EventList from "./events/EventList";
import AdminLayout from "./layout/AdminLayout";

function PrivateRoute({ children }) {
    const { user, loading, deviceTrusted, pendingAuth } = useAuth();
    const location = useLocation();

    if (loading) return <div className="loading-screen">Loading...</div>;

    // If not logged in AND not in pending verification, go to login
    if (!user && !pendingAuth) {
        return <Navigate to="/login" />;
    }

    // Force residents to email verification if they have an unverified email
    // Admins are always exempt
    const isResident =
        (user && user.role === "resident") ||
        (pendingAuth && pendingAuth.user.role === "resident");

    if (isResident) {
        // Condition 1: Untrusted Device Login
        if (pendingAuth && location.pathname !== "/device-verification") {
            return <Navigate to="/device-verification" />;
        }

        // Condition 2: Just Registered, waiting for email link
        if (
            user &&
            !user.email_verified_at &&
            location.pathname !== "/verify-pending"
        ) {
            return <Navigate to="/verify-pending" />;
        }
    }

    return children;
}

function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth();
    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    // Security hardened: show a clear 401 page instead of silently
    // redirecting residents back to "/" — they should know access is denied.
    if (!isAdmin) return <Unauthorized401 />;
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
                path="/device-verification"
                element={
                    <PrivateRoute>
                        <OtpVerification />
                    </PrivateRoute>
                }
            />
            <Route
                path="/verify-pending"
                element={
                    <PrivateRoute>
                        <VerificationPending />
                    </PrivateRoute>
                }
            />
            <Route path="/verify-email" element={<VerifyEmail />} />
            {/* ── Password Reset (public / guest routes) ── */}
            <Route
                path="/forgot-password"
                element={
                    <GuestRoute>
                        <ForgotPassword />
                    </GuestRoute>
                }
            />
            <Route
                path="/reset-password"
                element={
                    <GuestRoute>
                        <ResetPassword />
                    </GuestRoute>
                }
            />
            {/* Phone OTP reset — redirect target after SMS code is sent */}
            <Route
                path="/reset-password-otp"
                element={
                    <GuestRoute>
                        <ResetPasswordOtp />
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
                path="/users/:userId/profile"
                element={
                    <PrivateRoute>
                        <UserProfile />
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
            <Route
                path="/admin/users"
                element={
                    <AdminRoute>
                        <AdminUsers />
                    </AdminRoute>
                }
            />
            <Route
                path="/events"
                element={
                    <PrivateRoute>
                        <EventList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sms"
                element={
                    <AdminRoute>
                        <SmsSender />
                    </AdminRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function AppShell() {
    const { user, isAdmin, loading, pendingAuth } = useAuth();
    const location = useLocation();
    const isVerificationPage =
        location.pathname === "/verify-pending" ||
        location.pathname === "/device-verification";
    const isGuestPage = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/reset-password-otp",
    ].includes(location.pathname);

    if (loading) return <div className="loading-screen">Loading...</div>;

    // Isolate verification page - no Navbar, no Sidebar
    // This applies if we are in pendingAuth state OR we are an unverified resident
    if (isVerificationPage && (pendingAuth || user)) {
        return (
            <div className="app-container verification-only">
                <main>
                    <AppRoutes />
                </main>
            </div>
        );
    }

    // Admin users: sidebar layout on ALL other pages
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

function MainApp() {
    return (
        <Router>
            <AuthProvider>
                <ToastProvider>
                    <NotificationProvider>
                        <AppShell />
                    </NotificationProvider>
                </ToastProvider>
            </AuthProvider>
        </Router>
    );
}

const appElement = document.getElementById("app");
if (appElement) {
    const root = createRoot(appElement);
    root.render(<MainApp />);
}
