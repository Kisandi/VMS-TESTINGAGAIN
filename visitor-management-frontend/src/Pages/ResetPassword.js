// Pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Style.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import {ToastContainer} from "react-toastify";

function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [strength, setStrength] = useState('');

    useEffect(() => {
        evaluateStrength(password);
    }, [password]);

    const evaluateStrength = (pwd) => {
        if (!pwd) return setStrength('');

        const hasLower = /[a-z]/.test(pwd);
        const hasUpper = /[A-Z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecial = /[@$!%*?&]/.test(pwd);

        const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

        switch (score) {
            case 4: setStrength('Strong'); break;
            case 3: setStrength('Medium'); break;
            case 2: setStrength('Weak'); break;
            default: setStrength('Very Weak'); break;
        }
    };

    const validatePassword = (pwd, confirmPwd) => {
        if (!pwd.trim()) return 'Password is required.';
        if (pwd.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Z]/.test(pwd)) return 'Must include an uppercase letter.';
        if (!/[a-z]/.test(pwd)) return 'Must include a lowercase letter.';
        if (!/\d/.test(pwd)) return 'Must include a number.';
        if (!/[@$!%*?&]/.test(pwd)) return 'Must include a special character.';
        if (pwd !== confirmPwd) return 'Passwords do not match.';
        return '';
    };

    const handleReset = async (e) => {
        e.preventDefault();

        const validationError = validatePassword(password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');

        setLoading(true);

        try {
            const res = await fetch(`http://localhost:8080/api/v1/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setTimeout(() => navigate('/Admin/AdminLogin'), 2500);
            } else {
                toast.error(data.message || 'Reset failed');
            }
        } catch (err) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="reset-container">
            <div className="reset-box">
                <div className="reset-header">
                    <h2>Reset Password</h2>
                </div>
                <form className="reset-form" onSubmit={handleReset}>
                    <ToastContainer />
                    <div className="input-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={`password-input ${error ? 'input-error-border' : ''}`}
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword((prev) => !prev)}
                            role="button"
                            tabIndex={0}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onKeyDown={(e) => {
                                if (['Enter', ' '].includes(e.key)) setShowPassword((prev) => !prev);
                            }}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </span>
                    </div>

                    {/* Confirm Password input */}
                    <div className="input-wrapper">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className={`password-input ${error ? 'input-error-border' : ''}`}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            tabIndex={0}
                            role="button"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </span>
                    </div>


                    {error && <div className="input-error">{error}</div>}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                <p className="back-link">
                    <a href="/Admin/AdminLogin">← Back to Login</a>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;