import React from 'react';
import StatusBadge from './StatusBadge';

const ReportCard = ({ report, onClick }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            onClick={onClick}
            className="card cursor-pointer hover:scale-[1.02] transition-transform duration-200 animate-slide-up"
        >
            <div className="flex gap-4">
                <img
                    src={report.imageUrl}
                    alt="Report"
                    className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                            {report.title || 'Civic Issue Report'}
                        </h3>
                        <StatusBadge status={report.status} />
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {report.aiDescription?.substring(0, 100)}...
                    </p>
                    <p className="text-sm text-gray-600 mb-2">📍 {report.address}</p>
                    <p className="text-xs text-gray-500">🕒 {formatDate(report.createdAt)}</p>
                </div>
            </div>
        </div>
    );
};

export default ReportCard;
