import { supabase } from '../lib/supabase';

export const locationService = {
    // Get all unique states
    async getStates() {
        const { data, error } = await supabase
            .from('india_locations')
            .select('state')
            .order('state');

        if (error) throw error;

        // Get unique states
        const uniqueStates = [...new Set(data.map(item => item.state))];
        return uniqueStates;
    },

    // Get districts for a specific state
    async getDistricts(state) {
        const { data, error } = await supabase
            .from('india_locations')
            .select('district')
            .eq('state', state)
            .order('district');

        if (error) throw error;

        // Get unique districts
        const uniqueDistricts = [...new Set(data.map(item => item.district))];
        return uniqueDistricts;
    },

    // Get cities for a specific district
    async getCities(state, district) {
        const { data, error } = await supabase
            .from('india_locations')
            .select('city')
            .eq('state', state)
            .eq('district', district)
            .order('city');

        if (error) throw error;

        return data.map(item => item.city).filter(Boolean);
    },

    // Get collector info for a specific location
    async getCollectorInfo(state, district) {
        const { data, error } = await supabase
            .from('india_locations')
            .select('collector_name, collector_email, collector_phone')
            .eq('state', state)
            .eq('district', district)
            .single();

        if (error) {
            console.error('Collector info not found:', error);
            return null;
        }

        return data;
    },

    // Get all location data for a state
    async getLocationsByState(state) {
        const { data, error } = await supabase
            .from('india_locations')
            .select('*')
            .eq('state', state)
            .order('district');

        if (error) throw error;
        return data;
    }
};
