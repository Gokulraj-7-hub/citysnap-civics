import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import ReportCard from '../components/ReportCard';

const UserDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // TESTING MODE: Use mock user if no auth
    const mockUser = {
        id: 'test-user-123',
        username: 'Test User',
        email: 'test@example.com'
    };
    const currentUser = user || mockUser;

    useEffect(() => {
        fetchReports();
        fetchNotifications();

        // Set up real-time subscription
        const subscription = reportService.subscribeToUserReports(currentUser.id, (payload) => {
            console.log('Real-time update:', payload);
            setIsLive(true);

            // Handle different event types
            if (payload.eventType === 'INSERT') {
                // Add new report
                const newReport = reportService.mapReport ? reportService.mapReport(payload.new) : payload.new;
                setReports(prev => [newReport, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                // Update existing report
                const updatedReport = reportService.mapReport ? reportService.mapReport(payload.new) : payload.new;
                setReports(prev => prev.map(report =>
                    report.id === updatedReport.id ? updatedReport : report
                ));
            } else if (payload.eventType === 'DELETE') {
                // Remove deleted report
                setReports(prev => prev.filter(report => report.id !== payload.old.id));
                // Refresh notifications as admin may have created one
                fetchNotifications();
            }

            // Reset live indicator after 2 seconds
            setTimeout(() => setIsLive(false), 2000);
        });

        // Cleanup subscription on unmount
        return () => {
            reportService.unsubscribe(subscription);
        };
    }, [currentUser.id]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await reportService.getUserReports(currentUser.id);
            setReports(data.reports);
        } catch (err) {
            setError('Failed to load reports');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const data = await reportService.getNotifications(currentUser.id);
            setNotifications(data || []);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    };

    const handleLogout = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">🏛️ CitySnap</h1>
                                {isLive && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full animate-pulse">
                                        🔴 Live Update
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-600">Welcome, {currentUser.username}!</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Create Report Button */}
                            <button
                                onClick={() => navigate('/create-report')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                ➕ Create Report
                            </button>

                            {/* Notifications Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    🔔
                                    {notifications.filter(n => !n.read).length > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {notifications.filter(n => !n.read).length}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                                        <div className="p-3 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                No notifications
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`p-3 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                                                        onClick={async () => {
                                                            if (!notification.read) {
                                                                await reportService.markNotificationAsRead(notification.id);
                                                                fetchNotifications();
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-lg">
                                                                {notification.type === 'warning' ? '⚠️' :
                                                                    notification.type === 'success' ? '✅' :
                                                                        notification.type === 'error' ? '❌' : 'ℹ️'}
                                                            </span>
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                                                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {new Date(notification.created_at).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            {!notification.read && (
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleLogout} className="btn-secondary">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Action Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/create-report')}
                        className="btn-primary text-lg px-8 py-4"
                    >
                        ➕ Create New Report
                    </button>
                </div>

                {/* Reports Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Your Reports</h2>

                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">Loading reports...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {!loading && !error && reports.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl">
                            <p className="text-gray-600 text-lg">No reports yet</p>
                            <p className="text-gray-500 mt-2">Create your first report to get started!</p>
                        </div>
                    )}

                    {!loading && reports.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reports.map((report) => (
                                <ReportCard
                                    key={report._id}
                                    report={report}
                                    onClick={() => navigate(`/report/${report._id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;
