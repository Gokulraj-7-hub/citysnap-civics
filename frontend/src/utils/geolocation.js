/**
 * Get user's current location using browser geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                let message = 'Unable to retrieve location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location permission denied. Please enable location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out.';
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};

/**
 * Get address from coordinates using Nominatim (OpenStreetMap)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>}
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            }
        );
        const data = await response.json();
        return data.display_name || `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
};
