import React, { useState } from 'react';
import './AdminLogin.css';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function AdminLogin() {
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [blocked, setBlocked] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

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
                    setBlocked(true);
                    setServerError('Too many login attempts. Please try again after 15 minutes.');
                    setTimeout(() => setBlocked(false), 15 * 60 * 1000);
                } else {
                    const message = data?.message || 'Login failed. Please try again.';
                    setServerError(message);
                }
                return;
            }

            const ADMIN_TYPE_ID = 'UTI03';
            const isAdmin = data.user?.roles?.some(
                (role) => role.user_type_id === ADMIN_TYPE_ID
            );

            if (!isAdmin) {
                setServerError('You are not authorized as admin.');
                return;
            }

            navigate('/Admin/AdminDashboard');
        } catch {
            setServerError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login">
            <div className="admin-login-left">
                <img src="/images/v1.jpg" alt="Admin" />
            </div>
            <div className="admin-login-right">
                <h2>Admin Login</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {serverError && <div className="form-error">{serverError}</div>}

                    <label htmlFor="email">Email</label>
                    <input
                        type="text"
                        name="email"
                        id="email"
                        placeholder="Enter email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.email && touched.email ? 'input-error-border' : ''}
                        aria-invalid={errors.email ? 'true' : 'false'}
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
                            className={errors.password && touched.password ? 'input-error-border' : ''}
                            aria-invalid={errors.password ? 'true' : 'false'}
                        />
                        <span
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="toggle-password"
                            tabIndex={0}
                            role="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onKeyDown={(e) => {
                                if (['Enter', ' '].includes(e.key)) setShowPassword((prev) => !prev);
                            }}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </span>
                    </div>
                    {touched.password && errors.password && (
                        <div className="input-error">{errors.password}</div>
                    )}

                    <div className="admin-login-options">
                        <Link to="/forgot-password/admin">Forgot password?</Link>
                    </div>
                    <button type="submit" disabled={loading || blocked}>
                        {loading ? <span className="spinner" /> : 'Login'}
                    </button>
                </form>


            </div>
        </div>
    );
}

export default AdminLogin;
