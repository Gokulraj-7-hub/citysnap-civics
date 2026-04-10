import React from 'react';
import StatusBadge from './StatusBadge';

const ReportTable = ({ reports, onReportClick, onStatusUpdate }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {reports.map((report) => (
                        <tr
                            key={report._id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => onReportClick(report)}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <img
                                    src={report.imageUrl}
                                    alt="Report"
                                    className="w-16 h-16 object-cover rounded"
                                />
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-gray-900 max-w-xs truncate">
                                    {report.title || 'Civic Issue Report'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                                    {report.aiDescription?.substring(0, 80)}...
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-600 max-w-xs truncate">
                                    {report.address}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={report.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(report.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <select
                                    value={report.status}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onStatusUpdate(report._id, e.target.value);
                                    }}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReportTable;
