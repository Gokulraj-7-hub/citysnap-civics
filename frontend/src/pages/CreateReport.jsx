import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { reportService } from '../services/reportService';
import { getCurrentLocation } from '../utils/geolocation';
import CameraCapture from '../components/CameraCapture';
import ImageUpload from '../components/ImageUpload';
import MapPicker from '../components/MapPicker';

const CreateReport = () => {
    const [step, setStep] = useState(1);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [aiTitle, setAiTitle] = useState('');
    const [aiDescription, setAiDescription] = useState('');
    const [userNotes, setUserNotes] = useState('');
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCivicIssue, setIsCivicIssue] = useState(true); // Track if image is a civic issue
    const { user } = useAuth();
    const navigate = useNavigate();

    // Step 1: Image Capture/Upload
    const handleImageCapture = (file) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setShowCamera(false);
        setStep(2);
        generateCaption(file);
    };

    const handleImageUpload = (file) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        // setStep(2); // Removed, now handled in generateCaption after validation
        generateCaption(file);
    };

    // Step 2: AI Caption Generation
    const generateCaption = async (file) => {
        setLoading(true);
        setError('');
        try {
            const data = await aiService.generateCaption(file);
            setAiTitle(data.title);
            setAiDescription(data.description);
            setIsCivicIssue(data.isCivicIssue); // Set isCivicIssue state

            // Check if it's a civic issue
            if (!data.isCivicIssue) {
                setError(data.validationReason || 'This does not appear to be a civic infrastructure issue. Please upload a relevant image.');
                setImagePreview(''); // Clear preview
                setImageFile(null); // Clear file
                setLoading(false);
                setStep(1); // Go back to step 1
                return;
            }

            setStep(2); // Move to step 2 only if it's a civic issue
        } catch (err) {
            console.error('Caption generation error:', err);
            setError('Failed to generate caption. Please try again.');
            setImagePreview(''); // Clear preview
            setImageFile(null); // Clear file
            setStep(1); // Go back to step 1 on error
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Location Detection
    const detectLocation = async () => {
        setLoading(true);
        setError('');
        try {
            const coords = await getCurrentLocation();
            setLocation({ lat: coords.latitude, lng: coords.longitude });
            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Submit Report
    const handleSubmit = async () => {
        if (!location) {
            setError('Please set a location');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Upload handled in service


            await reportService.createReport({
                imageFile,
                title: aiTitle,
                aiDescription,
                userNotes,
                latitude: location.lat,
                longitude: location.lng
            });

            navigate('/dashboard');
        } catch (err) {
            console.error('Report creation error:', err);
            setError(err.message || err.response?.data?.message || 'Failed to create report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Create New Report</h1>
                        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            </header>

            {/* Progress Steps */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w - 10 h - 10 rounded - full flex items - center justify - center font - bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                                    } `}
                            >
                                {s}
                            </div>
                            {s < 4 && (
                                <div
                                    className={`w - 24 h - 1 ${step > s ? 'bg-primary-600' : 'bg-gray-300'} `}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Step 1: Image Capture/Upload */}
                {step === 1 && (
                    <div className="bg-white rounded-xl p-8 animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6">Step 1: Capture or Upload Image</h2>
                        <div className="space-y-4">
                            <button
                                onClick={() => setShowCamera(true)}
                                className="btn-primary w-full"
                            >
                                📸 Use Camera
                            </button>
                            <div className="text-center text-gray-500">or</div>
                            <ImageUpload onUpload={handleImageUpload} />
                        </div>
                    </div>
                )}

                {/* Step 2: AI Description */}
                {step === 2 && (
                    <div className="bg-white rounded-xl p-8 animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6">Step 2: Review AI Description</h2>

                        <img src={imagePreview} alt="Captured" className="w-full max-h-96 object-contain rounded-lg mb-6" />

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                                <p className="mt-4 text-gray-600">Generating AI title and description...</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Report Title
                                    </label>
                                    <input
                                        type="text"
                                        value={aiTitle}
                                        onChange={(e) => setAiTitle(e.target.value)}
                                        className="input-field"
                                        placeholder="AI-generated title will appear here..."
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        AI Generated Description
                                    </label>
                                    <textarea
                                        value={aiDescription}
                                        onChange={(e) => setAiDescription(e.target.value)}
                                        className="input-field min-h-32"
                                        placeholder="AI description will appear here..."
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        value={userNotes}
                                        onChange={(e) => setUserNotes(e.target.value)}
                                        className="input-field min-h-24"
                                        placeholder="Add any additional details..."
                                    />
                                </div>

                                <button onClick={detectLocation} className="btn-primary w-full">
                                    Next: Set Location →
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Step 3: Location */}
                {step === 3 && (
                    <div className="bg-white rounded-xl p-8 animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6">Step 3: Confirm Location</h2>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                                <p className="mt-4 text-gray-600">Detecting location...</p>
                            </div>
                        ) : location ? (
                            <>
                                <MapPicker location={location} onLocationChange={setLocation} />
                                <button
                                    onClick={() => setStep(4)}
                                    className="btn-primary w-full mt-6"
                                >
                                    Next: Review & Submit →
                                </button>
                            </>
                        ) : (
                            <button onClick={detectLocation} className="btn-primary w-full">
                                📍 Detect My Location
                            </button>
                        )}
                    </div>
                )}

                {/* Step 4: Review & Submit */}
                {step === 4 && (
                    <div className="bg-white rounded-xl p-8 animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6">Step 4: Review & Submit</h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Image:</h3>
                                <img src={imagePreview} alt="Report" className="w-full max-h-64 object-contain rounded-lg" />
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Title:</h3>
                                <p className="text-gray-700 bg-gray-50 p-4 rounded font-semibold">{aiTitle}</p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Description:</h3>
                                <p className="text-gray-700 bg-gray-50 p-4 rounded">{aiDescription}</p>
                            </div>

                            {userNotes && (
                                <div>
                                    <h3 className="font-semibold mb-2">Additional Notes:</h3>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded">{userNotes}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold mb-2">Location:</h3>
                                <p className="text-gray-700 bg-gray-50 p-4 rounded">
                                    Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="btn-primary flex-1"
                                >
                                    {loading ? 'Submitting...' : '✓ Submit Report'}
                                </button>
                                <button onClick={() => setStep(3)} className="btn-secondary">
                                    ← Back
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleImageCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}
        </div>
    );
};

export default CreateReport;
