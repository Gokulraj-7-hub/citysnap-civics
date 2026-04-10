import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { reportService } from '../services/reportService';

const AdminDashboard = () => {
    // TESTING MODE: Use mock admin user
    const mockUser = { email: 'admin@citysnap.com', id: 'admin-123' };
    const [user, setUser] = useState(mockUser);
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [analytics, setAnalytics] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    const [statusFilter, setStatusFilter] = useState('all');
    const [isLive, setIsLive] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // TESTING MODE: Skip auth check, directly fetch data
        fetchReports();
        fetchAnalytics();

        // Set up real-time subscription for all reports
        const subscription = reportService.subscribeToAllReports((payload) => {
            console.log('Admin real-time update:', payload);
            setIsLive(true);

            // Handle different event types
            if (payload.eventType === 'INSERT') {
                const newReport = payload.new;
                setReports(prev => [newReport, ...prev]);
                // Update analytics
                setAnalytics(prev => ({
                    ...prev,
                    total: prev.total + 1,
                    [newReport.status === 'in-progress' ? 'inProgress' : newReport.status]: prev[newReport.status === 'in-progress' ? 'inProgress' : newReport.status] + 1
                }));
            } else if (payload.eventType === 'UPDATE') {
                const updatedReport = payload.new;
                const oldReport = payload.old;

                setReports(prev => prev.map(report =>
                    report.id === updatedReport.id ? updatedReport : report
                ));

                // Update analytics if status changed
                if (oldReport.status !== updatedReport.status) {
                    setAnalytics(prev => {
                        const newAnalytics = { ...prev };
                        const oldStatusKey = oldReport.status === 'in-progress' ? 'inProgress' : oldReport.status;
                        const newStatusKey = updatedReport.status === 'in-progress' ? 'inProgress' : updatedReport.status;
                        newAnalytics[oldStatusKey] = Math.max(0, newAnalytics[oldStatusKey] - 1);
                        newAnalytics[newStatusKey] = newAnalytics[newStatusKey] + 1;
                        return newAnalytics;
                    });
                }
            } else if (payload.eventType === 'DELETE') {
                const deletedReport = payload.old;
                setReports(prev => prev.filter(report => report.id !== deletedReport.id));
                setAnalytics(prev => ({
                    ...prev,
                    total: Math.max(0, prev.total - 1),
                    [deletedReport.status === 'in-progress' ? 'inProgress' : deletedReport.status]: Math.max(0, prev[deletedReport.status === 'in-progress' ? 'inProgress' : deletedReport.status] - 1)
                }));
            }

            setTimeout(() => setIsLive(false), 2000);
        });

        return () => {
            reportService.unsubscribe(subscription);
        };
    }, []);

    useEffect(() => {
        // Apply filter
        if (statusFilter === 'all') {
            setFilteredReports(reports);
        } else {
            setFilteredReports(reports.filter(r => r.status === statusFilter));
        }
    }, [reports, statusFilter]);

    const fetchReports = async () => {
        try {
            const data = await reportService.getAllReports();
            setReports(data.reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const data = await reportService.getAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            await reportService.updateReportStatus(reportId, newStatus);
            // Real-time subscription will handle the UI update
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (report) => {
        // Confirmation dialog
        const confirmMessage = `Are you sure you want to delete this report?\n\nTitle: ${report.title || 'Civic Issue Report'}\nStatus: ${report.status}\n\nThis action cannot be undone.`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            // Create notification for the user if report has a user_id
            if (report.user_id) {
                await reportService.createNotification(
                    report.user_id,
                    'Report Deleted',
                    `Your report "${report.title || 'Civic Issue Report'}" has been deleted by an administrator. Reason: ${report.status === 'resolved' ? 'Issue has been resolved' : 'Duplicate report from same location'}.`,
                    'warning'
                );
            }

            // Delete the report
            await reportService.deleteReport(report.id);

            // Real-time subscription will handle removing from UI
            alert('Report deleted successfully and user has been notified.');
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report: ' + error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-red-100 text-red-700';
            case 'in-progress': return 'bg-orange-100 text-orange-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    🏛️ CitySnap Admin Dashboard
                                </h1>
                                {isLive && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full animate-pulse">
                                        🔴 Live Update
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-600 mt-1">Welcome, {user?.email}!</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-medium mb-2">Total Reports</h3>
                        <p className="text-4xl font-bold">{analytics.total}</p>
                        <p className="text-sm opacity-90 mt-2">All time</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-medium mb-2">Pending</h3>
                        <p className="text-4xl font-bold">{analytics.pending}</p>
                        <p className="text-sm opacity-90 mt-2">Awaiting review</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-medium mb-2">In Progress</h3>
                        <p className="text-4xl font-bold">{analytics.inProgress}</p>
                        <p className="text-sm opacity-90 mt-2">Being addressed</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-medium mb-2">Resolved</h3>
                        <p className="text-4xl font-bold">{analytics.resolved}</p>
                        <p className="text-sm opacity-90 mt-2">Completed</p>
                    </div>
                </div>

                {/* Reports Section */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">All Reports</h2>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    {filteredReports.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No reports found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Image</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <img
                                                    src={report.image_url}
                                                    alt="Report"
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">{report.title || 'Civic Issue Report'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-600 max-w-xs truncate">{report.ai_description}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-600">{report.address || 'N/A'}</p>
                                                <p className="text-xs text-gray-400">
                                                    {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-600">
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <select
                                                        value={report.status}
                                                        onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                                                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in-progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleDelete(report)}
                                                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                                                        title="Delete report"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
