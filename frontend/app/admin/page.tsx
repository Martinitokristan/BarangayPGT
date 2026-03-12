'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { RiShieldStarFill, RiAlarmWarningFill } from "react-icons/ri";
import {
    HiClipboardList,
    HiUsers,
    HiClock,
    HiCheckCircle,
    HiTrendingUp,
    HiCalendar,
} from "react-icons/hi";
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Filler,
    Tooltip,
    Legend,
);

const PURPOSE_COLORS: Record<string, string> = {
    complaint: "#e74c3c",
    problem: "#f39c12",
    emergency: "#c0392b",
    suggestion: "#2ecc71",
    general: "#3498db",
};

const URGENCY_COLORS: Record<string, string> = {
    high: "#e74c3c",
    medium: "#f39c12",
    low: "#2ecc71",
};

export default function AdminDashboard() {
    const { showToast } = useToast();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();

        // Polling for real-time stats updates (every 30 seconds)
        const pollInterval = setInterval(() => {
            fetchDashboard(true); // pass true to indicate it's a silent background refresh
        }, 30000);

        return () => clearInterval(pollInterval);
    }, []);

    const fetchDashboard = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res = await api.get("/admin/dashboard");
            setStats(res.data);
        } catch (e) {
            if (!isBackground) showToast("Failed to load dashboard data.", "error");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading dashboard...</div>;
    if (!stats) return <div className="empty-state">Failed to load dashboard stats.</div>;

    // Chart data for Posts by Purpose (Doughnut)
    const purposeLabels = stats.posts_by_purpose ? Object.keys(stats.posts_by_purpose) : [];
    const purposeData = stats.posts_by_purpose ? Object.values(stats.posts_by_purpose) : [];
    const purposeChartData = {
        labels: purposeLabels.map(
            (l) => l.charAt(0).toUpperCase() + l.slice(1),
        ),
        datasets: [
            {
                data: purposeData,
                backgroundColor: purposeLabels.map(
                    (l) => PURPOSE_COLORS[l] || "#95a5a6",
                ),
                borderWidth: 2,
                borderColor: "#fff",
            },
        ],
    };

    // Chart data for Posts by Urgency (Doughnut)
    const urgencyLabels = stats.posts_by_urgency ? Object.keys(stats.posts_by_urgency) : [];
    const urgencyData = stats.posts_by_urgency ? Object.values(stats.posts_by_urgency) : [];
    const urgencyChartData = {
        labels: urgencyLabels.map(
            (l) => l.charAt(0).toUpperCase() + l.slice(1),
        ),
        datasets: [
            {
                data: urgencyData,
                backgroundColor: urgencyLabels.map(
                    (l) => URGENCY_COLORS[l] || "#95a5a6",
                ),
                borderWidth: 2,
                borderColor: "#fff",
            },
        ],
    };

    // Chart data for Status Breakdown (Area/Line)
    const statusChartData = {
        labels: ["Pending", "In Progress", "Resolved"],
        datasets: [
            {
                label: "Posts",
                data: [
                    stats.pending_posts || 0,
                    stats.in_progress_posts || 0,
                    stats.resolved_posts || 0,
                ],
                borderColor: "#2ecc71",
                backgroundColor: 'rgba(46, 204, 113, 0.2)', // Light green fill
                fill: true,
                tension: 0.4, // Smooth curve
                pointBackgroundColor: "#2ecc71",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: { padding: 15, usePointStyle: true },
            },
        },
    };

    const areaOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h2>
                    <RiShieldStarFill /> Admin Dashboard
                </h2>
                <div className="dashboard-actions">
                    <Link href="/admin/posts" className="btn btn-primary">
                        <HiClipboardList /> Manage All Posts
                    </Link>
                    <Link href="/events" className="btn btn-primary">
                        <HiCalendar /> Manage Events
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-number">{stats.total_posts}</div>
                    <div className="stat-label">
                        <HiClipboardList /> Total Posts
                    </div>
                </div>
                <div className="stat-card stat-urgent">
                    <div className="stat-number">{stats.urgent_posts}</div>
                    <div className="stat-label">
                        <RiAlarmWarningFill /> Active Urgent
                    </div>
                </div>
                <div className="stat-card stat-pending">
                    <div className="stat-number">{stats.pending_posts}</div>
                    <div className="stat-label">
                        <HiClock /> Pending
                    </div>
                </div>
                <div className="stat-card stat-progress">
                    <div className="stat-number">{stats.in_progress_posts}</div>
                    <div className="stat-label">
                        <HiTrendingUp /> In Progress
                    </div>
                </div>
                <div className="stat-card stat-resolved">
                    <div className="stat-number">{stats.resolved_posts}</div>
                    <div className="stat-label">
                        <HiCheckCircle /> Resolved
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{stats.total_residents}</div>
                    <div className="stat-label">
                        <HiUsers /> Residents
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="dashboard-panels">
                <div className="panel chart-panel">
                    <h3>Posts by Purpose</h3>
                    <div className="chart-wrapper">
                        <Doughnut
                            data={purposeChartData}
                            options={chartOptions}
                        />
                    </div>
                </div>

                <div className="panel chart-panel">
                    <h3>Posts by Urgency</h3>
                    <div className="chart-wrapper">
                        <Doughnut
                            data={urgencyChartData}
                            options={chartOptions}
                        />
                    </div>
                </div>

                <div className="panel chart-panel">
                    <h3>Status Overview</h3>
                    <div className="chart-wrapper">
                        <Line data={statusChartData} options={areaOptions} />
                    </div>
                </div>
            </div>

            {/* Recent Urgent Posts */}
            {stats.recent_urgent_posts &&
                stats.recent_urgent_posts.length > 0 && (
                    <div className="panel urgent-panel">
                        <h3>
                            <RiAlarmWarningFill /> Recent Urgent Posts
                            (Unresolved)
                        </h3>
                        <div className="urgent-list">
                            {stats.recent_urgent_posts.map((post: any) => (
                                <Link
                                    key={post.id}
                                    href={`/posts/${post.id}`}
                                    className="urgent-item"
                                >
                                    <div>
                                        <strong>{post.title}</strong>
                                        <p>
                                            By {post.user?.name} —{" "}
                                            {new Date(
                                                post.created_at,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`badge-status status-${post.status}`}
                                    >
                                        {post.status.replace("_", " ")}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
}
