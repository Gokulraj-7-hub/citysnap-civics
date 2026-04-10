import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue in Vite — use CDN URLs directly
const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const MapPicker = ({ location, onLocationChange }) => {
    const [position, setPosition] = useState(location || { lat: 20.5937, lng: 78.9629 }); // India center
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const provider = new OpenStreetMapProvider();

    useEffect(() => {
        if (location) {
            setPosition(location);
        }
    }, [location]);

    // Component to handle map clicks
    function LocationMarker() {
        const map = useMapEvents({
            click(e) {
                const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
                setPosition(newPos);
                onLocationChange(newPos);
            },
        });

        useEffect(() => {
            map.flyTo(position, map.getZoom());
        }, [position, map]);

        return <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const newPos = {
                        lat: e.target.getLatLng().lat,
                        lng: e.target.getLatLng().lng
                    };
                    setPosition(newPos);
                    onLocationChange(newPos);
                }
            }}
        />;
    }

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;

        setSearching(true);
        try {
            const results = await provider.search({ query: searchQuery });
            if (results.length > 0) {
                const newPos = { lat: results[0].y, lng: results[0].x };
                setPosition(newPos);
                onLocationChange(newPos);
            } else {
                alert('Location not found. Please try a different search term.');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Box */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a location..."
                    className="input-field flex-1"
                />
                <button
                    type="submit"
                    className="btn-secondary"
                    disabled={searching}
                >
                    {searching ? 'Searching...' : '🔍 Search'}
                </button>
            </form>

            {/* Map */}
            <MapContainer
                center={position}
                zoom={13}
                style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker />
            </MapContainer>

            {/* Location Info */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">📍 Current Location:</p>
                <p>Latitude: {position.lat.toFixed(6)}</p>
                <p>Longitude: {position.lng.toFixed(6)}</p>
                <p className="text-xs mt-2 text-gray-500">
                    💡 Tip: Click map, drag marker, or search to adjust location
                </p>
            </div>
        </div>
    );
};

export default MapPicker;
