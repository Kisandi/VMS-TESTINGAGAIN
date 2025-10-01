import React, { useState } from 'react';
import './ReceptionistLogin.css';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function ReceptionistLogin(){
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({ email: false, password: false });
    const [loading, setLoading] = useState(false);



    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        let newErrors = {};

        if (!trimmedEmail) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(trimmedEmail)) {
            newErrors.email = "Invalid email address.";
        }

        if (!trimmedPassword) {
            newErrors.password = "Password is required.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);

            const newTouched = {};
            if (newErrors.email) newTouched.email = true;
            if (newErrors.password) newTouched.password = true;

            setTouched(prev => ({ ...prev, ...newTouched }));
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/v1/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                let serverError = 'Login failed.';
                if (response.status === 401) {
                    serverError = "Invalid email or password.";
                } else if (response.status === 403) {
                    serverError = "Access denied. Please contact administrator.";
                } else if (response.status === 500) {
                    serverError = 'Server error. Please try again later.';
                }

                setErrors({ server: serverError });
                setTouched(prev => ({ ...prev, email: true, password: true }));
                setLoading(false);
                return;
            }

            if (data.success) {
                const RECEPTIONIST_TYPE_ID = 'UTI02';
                const isReceptionist = data.user.roles.some(role => role.user_type_id === RECEPTIONIST_TYPE_ID);
                if (isReceptionist) {
                    // sessionStorage.setItem('user', JSON.stringify(data.user));
                    // sessionStorage.setItem('accessToken', data.accessToken);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    navigate('/Receptionist/ReceptionistDashboard');
                } else {
                    setErrors({ server: 'You are not authorized as receptionist' });
                    setTouched(prev => ({ ...prev, email: true, password: true }));
                }
            } else {
                setErrors({ server: data.message || 'Invalid credentials' });
                setTouched(prev => ({ ...prev, email: true, password: true }));
            }
        } catch (err) {
            console.log("ERROR:", err.response?.data || err.message);
            const backendMessage = err?.response?.data?.message || 'Login failed. Please try again.';
            setErrors({ server: backendMessage });
            setTouched(prev => ({ ...prev, email: true, password: true }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="receptionist-login">
            <div className="receptionist-login-left">
                <img src="/images/v1.jpg" alt="Receptionist" />
            </div>
            <div className="receptionist-login-right">
                <h2>Receptionist Login</h2>
                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        type="text"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setErrors(prevErrors => {
                                const newErrors = { ...prevErrors };
                                delete newErrors.email;  // clear email error when editing email
                                return newErrors;
                            });
                        }}

                        onBlur={() => {
                            setTouched(prev => ({ ...prev, email: true }));
                            setErrors(prevErrors => {
                                const newErrors = { ...prevErrors };
                                const trimmed = email.trim();
                                setEmail(trimmed);
                                if (!trimmed) {
                                    newErrors.email = "Email is required";
                                } else if (!validateEmail(trimmed)) {
                                    newErrors.email = "Invalid email address";
                                } else {
                                    delete newErrors.email;
                                }
                                return newErrors;
                            });
                        }}

                    />
                    {touched.email && errors.email && (
                        <div className="field-error">
                            <span className="error-icon">⚠️</span> {errors.email}
                        </div>
                    )}

                    <label htmlFor="password">Password</label>
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative'  }}>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}  // <-- toggle here
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors(prevErrors => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors.password;
                                    return newErrors;
                                });
                            }}
                            onBlur={() => {
                                setTouched(prev => ({ ...prev, password: true }));
                                setErrors(prevErrors => {
                                    const newErrors = { ...prevErrors };
                                    const trimmed = password.trim();
                                    if (!trimmed) {
                                        newErrors.password = "Password is required";
                                    } else {
                                        delete newErrors.password;
                                    }
                                    return newErrors;
                                });
                            }}

                        />
                        <span
                            onClick={() => setShowPassword(prev => !prev)}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                userSelect: 'none',
                                color: '#888',
                                fontSize: '20px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(prev => !prev); }}
                        >
  {showPassword ? <FiEyeOff /> : <FiEye />}
</span>

                    </div>
                    {touched.password && errors.password && (
                        <div className="field-error">
                            <span className="error-icon">⚠️</span> {errors.password}
                        </div>
                    )}


                    <div className="receptionist-login-options">

                        <Link to="/forgot-password/receptionist">Forgot password?</Link>
                    </div>

                    {errors.server && (
                        <div className="form-error">{errors.server}</div>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ReceptionistLogin;