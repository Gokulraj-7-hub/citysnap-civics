import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const ReportMap = ({ reports }) => {
    // Calculate center from reports or use India center
    const center = reports.length > 0
        ? { lat: reports[0].latitude, lng: reports[0].longitude }
        : { lat: 20.5937, lng: 78.9629 };

    return (
        <MapContainer
            center={center}
            zoom={6}
            style={{ height: '600px', width: '100%', borderRadius: '0.5rem' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {reports.map((report) => (
                <Marker
                    key={report.id}
                    position={{ lat: report.latitude, lng: report.longitude }}
                >
                    <Popup>
                        <div className="p-2">
                            <h3 className="font-bold text-sm">{report.title}</h3>
                            <p className="text-xs text-gray-600 mt-1">{report.aiDescription?.substring(0, 100)}...</p>
                            <p className="text-xs text-gray-500 mt-2">
                                Status: <span className={`font-medium ${report.status === 'resolved' ? 'text-green-600' :
                                        report.status === 'in-progress' ? 'text-orange-600' :
                                            'text-red-600'
                                    }`}>{report.status}</span>
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default ReportMap;
