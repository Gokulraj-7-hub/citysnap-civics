import axios from 'axios';

/**
 * Reverse geocode coordinates to address using Google Maps API
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} - Formatted address
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/geocode/json',
            {
                params: {
                    latlng: `${latitude},${longitude}`,
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            }
        );

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            return response.data.results[0].formatted_address;
        } else if (response.data.status === 'ZERO_RESULTS') {
            return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        } else {
            throw new Error(`Geocoding failed: ${response.data.status}`);
        }
    } catch (error) {
        console.error('Geocoding error:', error.message);
        // Fallback to coordinates if geocoding fails
        return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
};
