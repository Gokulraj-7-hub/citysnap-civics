import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-icon">🏛️</div>
                    <h1 className="hero-title">CitySnap</h1>
                    <p className="hero-subtitle">Report Civic Issues in Your City</p>
                    <p className="hero-description">
                        Help make your city better by reporting civic issues like potholes,
                        broken streetlights, garbage dumps, and more. Your reports reach
                        local authorities directly.
                    </p>
                    <div className="hero-buttons">
                        <button
                            className="btn-primary-large"
                            onClick={() => navigate('/login')}
                        >
                            📝 Get Started
                        </button>
                        <button
                            className="btn-secondary-large"
                            onClick={() => navigate('/admin/login')}
                        >
                            👨‍💼 Admin Login
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <h2 className="section-title">Why Use CitySnap?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📸</div>
                        <h3>Easy Reporting</h3>
                        <p>Simply upload a photo of the issue. No account needed!</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI Powered</h3>
                        <p>Automatic description generation using AI technology</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📍</div>
                        <h3>Location Based</h3>
                        <p>Precise location marking with interactive maps</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Track Progress</h3>
                        <p>Real-time updates on report status and resolution</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🚀</div>
                        <h3>Fast & Free</h3>
                        <p>Quick submission process, completely free to use</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Anonymous</h3>
                        <p>Report issues without creating an account</p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <h2 className="section-title">How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-icon">📸</div>
                        <h3>Capture</h3>
                        <p>Take a photo of the civic issue you want to report</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-icon">📝</div>
                        <h3>Describe</h3>
                        <p>AI generates description, you can edit and add details</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-icon">📍</div>
                        <h3>Locate</h3>
                        <p>Mark the exact location on the map</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step">
                        <div className="step-number">4</div>
                        <div className="step-icon">✅</div>
                        <h3>Submit</h3>
                        <p>Report sent directly to local authorities</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <h2>Ready to Make a Difference?</h2>
                <p>Start reporting civic issues in your area today</p>
                <button
                    className="btn-primary-large"
                    onClick={() => navigate('/login')}
                >
                    Get Started →
                </button>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>© 2026 CitySnap. Making cities better, one report at a time.</p>
            </footer>
        </div>
    );
};

export default Landing;
