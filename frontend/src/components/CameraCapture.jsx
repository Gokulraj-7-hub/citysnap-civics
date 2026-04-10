import React, { useState, useRef } from 'react';

const CameraCapture = ({ onCapture, onCancel }) => {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('Unable to access camera. Please check permissions.');
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            onCapture(file);
        }, 'image/jpeg', 0.9);
    };

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

    React.useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 animate-fade-in">
                <h3 className="text-2xl font-bold mb-4">Capture Image</h3>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-auto"
                    />
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-3">
                    <button
                        onClick={captureImage}
                        disabled={!stream}
                        className="btn-primary flex-1"
                    >
                        📸 Capture
                    </button>
                    <button
                        onClick={handleCancel}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraCapture;
