import React from 'react';

const StatusBadge = ({ status }) => {
    const getStatusStyles = () => {
        switch (status) {
            case 'pending':
                return 'bg-red-100 text-red-800 border border-red-200';
            case 'in-progress':
                return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'resolved':
                return 'bg-green-100 text-green-800 border border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'in-progress':
                return 'In Progress';
            case 'resolved':
                return 'Resolved';
            default:
                return status;
        }
    };

    return (
        <span className={`status-badge ${getStatusStyles()}`}>
            {getStatusText()}
        </span>
    );
};

export default StatusBadge;
