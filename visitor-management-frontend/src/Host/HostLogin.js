import React, { useState, useEffect } from 'react';
import './HostLogin.css';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';


function HostLogin() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [blocked, setBlocked] = useState(false);
    const [lockoutEndTime, setLockoutEndTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

    const validateEmail = (email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


    const validateForm = () => {
        const validationErrors = {};
        const trimmedEmail = form.email.trim();
        const trimmedPassword = form.password.trim();

        if (!trimmedEmail) validationErrors.email = 'Email is required.';
        else if (!validateEmail(trimmedEmail)) validationErrors.email = 'Invalid email address.';

        if (!trimmedPassword) validationErrors.password = 'Password is required.';

        return validationErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setServerError('');
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
    };
    useEffect(() => {
        const stored = localStorage.getItem('host-lockout-end');
        if (stored && Date.now() < stored) {
            setBlocked(true);
            setLockoutEndTime(Number(stored));
        }
    }, []);

    useEffect(() => {
        if (!blocked || !lockoutEndTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = lockoutEndTime - now;

            if (diff <= 0) {
                setBlocked(false);
                setLockoutEndTime(null);
                setTimeLeft('');
                localStorage.removeItem('host-lockout-end');
                clearInterval(interval);
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [blocked, lockoutEndTime]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (blocked) {
            setServerError(`You are temporarily blocked. Please wait ${timeLeft || 'a few minutes'} before trying again.`);
            return;
        }

        const validationErrors = validateForm();
        setErrors(validationErrors);
        setTouched({ email: true, password: true });

        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        setServerError('');

        try {
            const response = await fetch('http://localhost:8080/api/v1/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: form.email.trim(),
                    password: form.password.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    const unlockTime = Date.now() + 15 * 60 * 1000;
                    setBlocked(true);
                    setLockoutEndTime(unlockTime);
                    localStorage.setItem('host-lockout-end', unlockTime);
                    //setServerError('Too many login attempts input. Please try again after 15 minutes.');
                } else {
                    const message = data?.message || 'Login failed. Please try again.';
                    setServerError(message);
                }
                return;
            }

            const  HOST_TYPE_ID = 'UTI01';
            const isAdmin = data.user?.roles?.some(
                (role) => role.user_type_id === HOST_TYPE_ID
            );


            if (!isAdmin) {
                setServerError('You are not authorized as a host.');
                return;
            }
// ✅ Save host ID
            localStorage.setItem('user_id', data.user?.id);

// Optional: Save full user object
            localStorage.setItem('user', JSON.stringify(data.user));

            console.log(JSON.parse(localStorage.getItem('user')));

            navigate('/Host/HostDashboard');
        } catch {
            setServerError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="host-login">
            <div className="host-login-left">
                <img src="/images/v1.jpg" alt="Host" />
            </div>
            <div className="host-login-right">
                <h2>Host Login</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {serverError && <div className="form-error">{serverError}</div>}
                    <label>Email</label>
                    <input
                        type="text"
                        name="email"
                        id="email"
                        placeholder="Enter email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${errors.email && touched.email ? 'input-error-border' : ''} ${blocked ? 'input-disabled' : ''}`}
                        aria-invalid={errors.email ? 'true' : 'false'}
                        disabled={blocked}
                    />
                    {touched.email && errors.email && (
                        <div className="input-error">{errors.email}</div>
                    )}

                    <label htmlFor="password">Password</label>
                    <div className="password-wrapper">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            value={form.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`${errors.password && touched.password ? 'input-error-border' : ''} ${blocked ? 'input-disabled' : ''}`}
                            aria-invalid={errors.password ? 'true' : 'false'}
                            disabled={blocked}
                        />
                        <span
                            onClick={() => setShowPassword((prev) => !prev)}
                            className={`toggle-password ${blocked ? 'disabled-toggle' : ''}`}
                            tabIndex={blocked ? -1 : 0}
                            role="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onKeyDown={(e) => {
                                if (!blocked && ['Enter', ' '].includes(e.key)) setShowPassword((prev) => !prev);
                            }}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </span>
                    </div>
                    {touched.password && errors.password && (
                        <div className="input-error">{errors.password}</div>
                    )}


                    <div className="host-login-options">

                        <Link to="/forgot-password/host" >Forgot password?</Link>
                    </div>
                    {blocked && (
                        <div className="lockout-warning">
                            You are blocked from logging in. Please wait: <strong>{timeLeft}</strong>
                        </div>
                    )}


                    <button type="submit" disabled={loading || blocked}
                            className={`login-button ${blocked ? 'button-disabled' : ''}`}>
                        {loading ? <span className="spinner" />  : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default HostLogin;
