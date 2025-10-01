import React, { useState, useEffect, useRef } from "react";
import './OtpVerification.css';
import { useLocation, useNavigate } from "react-router-dom";
import API from '../api/api';
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    getAuth
} from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const OtpVerification = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [method, setMethod] = useState("");
    const [value, setValue] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const [error, setError] = useState("");
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        const storedMethod = location.state?.method || sessionStorage.getItem("otpMethod");
        const storedValue = location.state?.value || sessionStorage.getItem("otpValue");

        if (!storedMethod || !storedValue) {
            navigate("/Visitor/Login");
        } else {
            setMethod(storedMethod);
            setValue(storedValue);
        }
    }, [location, navigate]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const setupRecaptchaAndSendOtp = (phoneNumber) => {
        setError("");
        const auth = getAuth();

        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(
                auth,
                'recaptcha-container',
                {
                    size: "invisible",
                    callback: () => {},
                    "expired-callback": () => {
                        setError("reCAPTCHA expired, please try again.");
                    }
                }
            );
        }

        const appVerifier = window.recaptchaVerifier;

        signInWithPhoneNumber(auth, "+94" + phoneNumber, appVerifier)
            .then((result) => {
                window.confirmationResult = result;
                setTimer(30);
            })
            .catch((error) => {
                console.error(error);
                setError("Failed to send OTP.");
            })
            .finally(() => setResending(false));
    };

    const resendPhoneOtp = () => {
        setResending(true);
        setupRecaptchaAndSendOtp(value);
        resetOtpFields();
    };

    const sendEmailOtp = async () => {
        setResending(true);
        try {
            await API.post("/send-otp", { method, value });
            setTimer(30);
            resetOtpFields();
        } catch (err) {
            console.error(err);
            setError("Failed to send OTP email.");
        } finally {
            setResending(false);
        }
    };

    const resetOtpFields = () => {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setError("");
    };

    const verifyPhoneOtp = async () => {
        try {
        const fullOtp = otp.join("");
        if (fullOtp.length < 6) {
            setError("Please enter the full 6-digit OTP.");
            return;
        }
            const firebaseConfirmation = window.confirmationResult;

            if (!firebaseConfirmation) {
                setError("OTP not sent or expired. Please resend OTP.");
                return;
            }

            await firebaseConfirmation.confirm(fullOtp);

            sessionStorage.removeItem("otpMethod");
            sessionStorage.removeItem("otpValue");
            navigate("/Visitor/Dashboard");

        } catch (error) {
            console.error(error);
            setError("Invalid OTP. Please try again.");
        }

    };

    const verifyEmailOtp = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < 6) {
            setError("Please enter the full 6-digit OTP.");
            return;
        }

        try {
            const response = await API.post("/verify-otp", {
                method,
                value,
                otp: fullOtp,
            });

            if (response.status === 200) {
                toast.success("✅ Email OTP verified!");
                sessionStorage.removeItem("otpMethod");
                sessionStorage.removeItem("otpValue");
                navigate("/Visitor/Dashboard");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Invalid or expired OTP");
        }
    };

    const handleChange = (e, index) => {
        const { value } = e.target;
        if (!/\d/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (index < 5 && value) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            const newOtp = [...otp];
            if (otp[index] === "") {
                if (index > 0) {
                    inputRefs.current[index - 1]?.focus();
                }
            } else {
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const handleSubmit = () => {
        setError("");
        if (method === "phone") {
            verifyPhoneOtp();
        } else {
            verifyEmailOtp();
        }
    };

    const handleResend = () => {
        setError("");
        if (resending || timer > 0) return;
        if (method === "phone") {
            resendPhoneOtp();
        } else {
            sendEmailOtp();
        }
    };

    return (
        <div className="otp-verification-container">
            <div className="company-name">☁ Company Name</div>
            <div className="verification-card">
                <h2>Verification Code</h2>
                <p>Enter the verification code sent to your {method === "phone" ? "phone number" : "email"}.</p>

                <div id="recaptcha-container"></div>

                <div className="otp-inputs">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-input-${index}`}
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            maxLength="1"
                            ref={(el) => (inputRefs.current[index] = el)}
                            className="otp-input"
                        />
                    ))}
                </div>

                {error && <div className="error">{error}</div>}

                <div className="button-group">
                    <button className="verify-button" onClick={handleSubmit} disabled={resending}>
                        Verify OTP
                    </button>

                    {timer > 0 ? (
                        <p className="resend-info">Resend OTP in {timer} seconds</p>
                    ) : (
                        <button
                            className="resend-button"
                            onClick={handleResend}
                            disabled={resending}
                        >
                            {resending ? "Resending..." : "Resend OTP"}
                        </button>
                    )}
                </div>
            </div>

            <ToastContainer position="top-center" className="custom-toast" autoClose={1500} hideProgressBar />
        </div>
    );
};

export default OtpVerification;
