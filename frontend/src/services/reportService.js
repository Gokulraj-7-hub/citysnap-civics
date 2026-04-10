import { supabase } from '../lib/supabase';
import { reverseGeocode } from '../utils/geolocation';

const mapReport = (report) => ({
    ...report,
    id: report.id,
    title: report.title,
    userId: report.user_id,
    imageUrl: report.image_url,
    aiDescription: report.ai_description,
    userNotes: report.user_notes,
    createdAt: report.created_at,
    updatedAt: report.updated_at
});

export const reportService = {
    async createReport(reportData) {
        const { imageFile, title, aiDescription, userNotes, latitude, longitude } = reportData;

        // 1. Upload image to Supabase Storage
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('report-images')
            .upload(filePath, imageFile);

        if (uploadError) throw new Error('Failed to upload image: ' + uploadError.message);

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('report-images')
            .getPublicUrl(filePath);

        // 3. Get Address
        const address = await reverseGeocode(latitude, longitude);

        // 4. Get Current User (Optional)
        let userId = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
        } catch (e) {
            console.log('User check failed, proceeding as anonymous');
        }

        // 5. Insert Report
        const { data, error } = await supabase
            .from('reports')
            .insert([
                {
                    user_id: userId, // Can be null for anonymous reports
                    title: title || 'Civic Issue Report',
                    image_url: publicUrl,
                    ai_description: aiDescription,
                    user_notes: userNotes,
                    latitude,
                    longitude,
                    address,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return mapReport(data);
    },

    async getAllReports(filters = {}) {
        let query = supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        // Date filters would need more complex query building if needed

        const { data, error } = await query;
        if (error) throw error;
        return { reports: data.map(mapReport) };
    },

    async getUserReports(userId) {
        let query = supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        // Handle mock user for testing - show anonymous reports
        if (userId === 'test-user-123') {
            query = query.is('user_id', null);
        } else {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { reports: data.map(mapReport) };
    },

    async getReportById(id) {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { report: mapReport(data) };
    },

    async updateReportStatus(id, status) {
        const { data, error } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { report: mapReport(data) };
    },

    async getAnalytics() {
        // This is a bit heavier on client, typically better on backend or using rpc
        // Using exact count for analytics
        const { count: total } = await supabase.from('reports').select('*', { count: 'exact', head: true });
        const { count: pending } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: inProgress } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'in-progress');
        const { count: resolved } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved');

        return {
            total,
            pending,
            inProgress,
            resolved
        };
    },

    /**
     * Subscribe to real-time updates for a specific user's reports
     * @param {string} userId - The user ID to filter reports
     * @param {function} callback - Callback function to handle updates
     * @returns {object} Subscription object
     */
    subscribeToUserReports(userId, callback) {
        const subscription = supabase
            .channel('user-reports')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'reports',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();

        return subscription;
    },

    /**
     * Subscribe to real-time updates for all reports (admin)
     * @param {function} callback - Callback function to handle updates
     * @returns {object} Subscription object
     */
    subscribeToAllReports(callback) {
        const subscription = supabase
            .channel('all-reports')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'reports'
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();

        return subscription;
    },

    /**
     * Unsubscribe from real-time updates
     * @param {object} subscription - The subscription object to unsubscribe
     */
    async unsubscribe(subscription) {
        if (subscription) {
            await supabase.removeChannel(subscription);
        }
    },

    /**
     * Delete a report (admin only)
     * @param {string} reportId - The report ID to delete
     */
    async deleteReport(reportId) {
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', reportId);

        if (error) throw error;
        return { success: true };
    },

    /**
     * Create a notification for a user
     * @param {string} userId - The user ID
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, warning, success, error)
     */
    async createNotification(userId, title, message, type = 'info') {
        const { data, error } = await supabase
            .from('notifications')
            .insert([
                {
                    user_id: userId,
                    title,
                    message,
                    type
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get notifications for a user
     * @param {string} userId - The user ID
     */
    async getNotifications(userId) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Mark notification as read
     * @param {string} notificationId - The notification ID
     */
    async markNotificationAsRead(notificationId) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return { success: true };
    }
};
