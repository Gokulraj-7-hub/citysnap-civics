import React, { useState } from 'react';

const ImageUpload = ({ onUpload }) => {
    const [preview, setPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            onUpload(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full">
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {preview ? (
                    <div className="space-y-4">
                        <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                        <label className="btn-secondary cursor-pointer inline-block">
                            Change Image
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-6xl">📁</div>
                        <div>
                            <p className="text-lg font-medium text-gray-700">
                                Drag and drop an image here
                            </p>
                            <p className="text-sm text-gray-500 mt-1">or</p>
                        </div>
                        <label className="btn-primary cursor-pointer inline-block">
                            Choose File
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
