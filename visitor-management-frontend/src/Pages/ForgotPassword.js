// src/ForgotPassword.js
import React, { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import './Style.css';
import {toast, ToastContainer} from 'react-toastify';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { useParams } from 'react-router-dom';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { role } = useParams();
    const [disabled, setDisabled] = useState(false);

    const validateEmail = (email) => {
        // Simple email regex
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) {
            setError('Email is required.');
            return;
        } else if (!validateEmail(email.trim())) {
            setError('Invalid email address.');
            return;
        }
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    role: role.toLowerCase() })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setEmail('');
                setDisabled(true);
            } else {
                if (data.message?.toLowerCase().includes('not found')) {
                    setError('Email not found. Please enter a registered email.');
                } else {
                    toast.error(data.message || 'Failed to send reset link');
                }
            }
        } catch (err) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-box">
                <div className="forgot-header">
                    <h2>Forgot your password?</h2>
                    <p>Enter your registered email and we’ll send a reset link.</p>
                </div>
                <form className="forgot-form" onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <Mail className="mail-icon" />
                        <input
                            type="text"
                            className="email-input"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={disabled}
                        />
                        {error && <div className="input-error">{error}</div>}

                    </div>
                    <button
                        type="submit"
                        disabled={loading || disabled}
                        className="submit-btn"
                    >
                        {loading ? <Loader2 className="loader" /> : 'Send Reset Link'}
                    </button>
                </form>
                <p className="back-link">
                    <a href="/Admin/AdminLogin">← Back to Login</a>
                </p>
            </div>
            <ToastContainer/>
        </div>
    );
}

export default ForgotPassword;
