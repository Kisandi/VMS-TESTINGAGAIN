import React, { useState, useEffect } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { RecaptchaVerifier, signInWithPhoneNumber, connectAuthEmulator } from "firebase/auth";
import { auth } from "./firebase";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormFeedback from "../FormFeedback";

function Login() {
  const [mode, setMode] = useState('email');
  const [inputValue, setInputValue] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) => /^7\d{8}$/.test(phone);


  useEffect(() => {
    window.confirmationResult = null;

    if (window.location.hostname === "localhost") {
      connectAuthEmulator(auth, "http://localhost:9099");
      console.log("✅ Using auth emulator");
    }

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('Recaptcha resolved', response);
        },
        'expired-callback': () => {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        }
      });

      window.recaptchaVerifier.render();
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const trimmedValue = inputValue.trim();
    let newErrors = {};

    if (!trimmedValue) {
      newErrors.inputValue = mode === "email" ? "Email is required" : "Phone number is required";
    } else {
      if (mode === "email" && !validateEmail(trimmedValue)) {
        newErrors.inputValue = "Invalid email address";
      }
      if (mode === "phone" && !validatePhone(trimmedValue)) {
        newErrors.inputValue = "Invalid phone number format";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(true);
      setLoading(false);
      return;
    }

    try {
      if (mode === "email") {
        const response = await API.post('/send-otp', {
          method: mode,
          value: trimmedValue,
        });

        if (response.status === 200) {
          const visitorData = response.data;
          if (!visitorData || !visitorData.visitor_id) {
            setErrors({ server: "Visitor data or visitor_id is missing in response" });
            setTouched(true);
            setLoading(false);
            return;
          }


          sessionStorage.setItem("otpMethod", mode);
          sessionStorage.setItem("otpValue", trimmedValue);
          localStorage.setItem("visitor_id", visitorData.visitor_id);

          toast.success("OTP sent to your email!");

          setTimeout(() => {
            navigate('/Visitor/verify-otp', {
              state: {
                method: mode,
                value: trimmedValue,
              }
            });
          }, 1000);
        }
      } else {
        const response = await API.post('/check-phone', { phone: trimmedValue });

        if (response.status === 200) {
          const visitorData = response.data;
          if (!visitorData || !visitorData.visitor_id) {
            setErrors({ server: "Visitor data or visitor_id is missing in response" });
            setTouched(true);
            setLoading(false);
            return;
          }


          const appVerifier = window.recaptchaVerifier;

          if (window.confirmationResult) {
            console.log("⛔ Firebase OTP already in progress");
            setLoading(false);
            return;
          }

          let phoneNumberFormatted = trimmedValue;
          if (!trimmedValue.startsWith('+')) {
            phoneNumberFormatted = '+94' + trimmedValue.replace(/^0+/, '');
          }

          sessionStorage.setItem("otpMethod", "phone");
          sessionStorage.setItem("otpValue", trimmedValue);
          localStorage.setItem("visitor_id", visitorData.visitor_id);

          toast.success("OTP sent to your phone!");

          window.confirmationResult = await signInWithPhoneNumber(auth, phoneNumberFormatted, appVerifier);


          setTimeout(() => {
            navigate('/Visitor/verify-otp', {
              state: {
                method: mode,
                value: trimmedValue,
              }
            });
          }, 1000);
        }
      }
    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
      const backendMessage = err?.response?.data?.message || err.message || 'Something went wrong';
      setErrors({ server: backendMessage });
      setTouched(true);
    }

    setLoading(false);
  };

  return (
      <div className="login-container">
        <div className="left-panel">
          <img src="/images/v1.jpg" alt="img" className="side-image" />
        </div>

        <div className="right-panel">
          <div className="company-header">
            <div className="company-name">☁ Company Name</div>
          </div>

          <div>
            <h2>Sign In</h2>
          </div>

          <div className="mode-toggle-switch">

            <div
                className={`toggle-option ${mode === 'phone' ? 'active' : ''}`}
                onClick={() => {
                  if (!loading) {
                    setMode('phone');
                    setInputValue('');
                    setErrors({});
                  }
                }}
            >
              Phone
            </div>
            <div
                className={`toggle-option ${mode === 'email' ? 'active' : ''}`}
                onClick={() => {
                  if (!loading) {
                    setMode('email');
                    setInputValue('');
                    setErrors({});
                  }
                }}
            >
              Email
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-wrapper">
              <span className="input-icon">{mode === 'email' ? '📧' : '📱'}</span>
              <input
                  type={mode === 'email' ? 'email' : 'tel'}
                  placeholder={mode === 'email' ? 'hello@example.com' : '7XXXXXXXX'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={() => {
                    setTouched(true);
                    if (!inputValue.trim()) {
                      setErrors({ inputValue: mode === "email" ? "Email is required" : "Phone number is required" });
                    }
                  }}
                  required
              />
            </div>

            <FormFeedback
                errors={errors}
                touched={touched}
                showToast={false}
            />

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Send OTP"}
            </button>

            <div id="recaptcha-container"></div>
          </form>

          <p className="register-text">
            Are you a new visitor? <Link to="/Visitor/Register">Register here</Link>
          </p>
        </div>

        <ToastContainer />
      </div>
  );
}

export default Login;
