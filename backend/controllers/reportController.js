import Report from '../models/Report.js';
import { reverseGeocode } from '../services/geocoding.js';

/**
 * Create a new report
 */
export const createReport = async (req, res) => {
    try {
        const { imageUrl, aiDescription, userNotes, latitude, longitude } = req.body;

        // Validate required fields
        if (!imageUrl || !aiDescription || !latitude || !longitude) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get address from coordinates
        const address = await reverseGeocode(latitude, longitude);

        // Create report
        const report = new Report({
            userId: req.user.id,
            imageUrl,
            aiDescription,
            userNotes: userNotes || '',
            latitude,
            longitude,
            address,
            status: 'pending'
        });

        await report.save();

        res.status(201).json({
            message: 'Report created successfully',
            report
        });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Server error creating report' });
    }
};

/**
 * Get all reports (admin only)
 */
export const getAllReports = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        // Build filter
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const reports = await Report.find(filter)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });

        res.json({ reports });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error fetching reports' });
    }
};

/**
 * Get reports by user
 */
export const getUserReports = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;

        // Users can only view their own reports, admins can view any
        if (req.user.role !== 'admin' && userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const reports = await Report.find({ userId })
            .sort({ createdAt: -1 });

        res.json({ reports });
    } catch (error) {
        console.error('Get user reports error:', error);
        res.status(500).json({ message: 'Server error fetching user reports' });
    }
};

/**
 * Get single report by ID
 */
export const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('userId', 'username email');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Users can only view their own reports, admins can view any
        if (req.user.role !== 'admin' && report.userId._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ report });
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ message: 'Server error fetching report' });
    }
};

/**
 * Update report status (admin only)
 */
export const updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Validate status
        if (!['pending', 'in-progress', 'resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        ).populate('userId', 'username email');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json({
            message: 'Report status updated successfully',
            report
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error updating report status' });
    }
};

/**
 * Get analytics data (admin only)
 */
export const getAnalytics = async (req, res) => {
    try {
        const totalReports = await Report.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const inProgressReports = await Report.countDocuments({ status: 'in-progress' });
        const resolvedReports = await Report.countDocuments({ status: 'resolved' });

        res.json({
            total: totalReports,
            pending: pendingReports,
            inProgress: inProgressReports,
            resolved: resolvedReports
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};
