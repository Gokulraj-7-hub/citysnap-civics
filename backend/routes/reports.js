import express from 'express';
import {
    createReport,
    getAllReports,
    getUserReports,
    getReportById,
    updateReportStatus,
    getAnalytics
} from '../controllers/reportController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reports - Create new report (authenticated users)
router.post('/', authenticateToken, createReport);

// GET /api/reports - Get all reports (admin only)
router.get('/', authenticateToken, requireAdmin, getAllReports);

// GET /api/reports/analytics - Get analytics (admin only)
router.get('/analytics', authenticateToken, requireAdmin, getAnalytics);

// GET /api/reports/user/:userId - Get user's reports
router.get('/user/:userId', authenticateToken, getUserReports);

// GET /api/reports/:id - Get single report
router.get('/:id', authenticateToken, getReportById);

// PATCH /api/reports/:id/status - Update report status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, updateReportStatus);

export default router;
