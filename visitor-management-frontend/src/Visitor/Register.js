import React, { useState } from 'react';
import './Register.css';
import { Link } from 'react-router-dom';
import { FiAlertCircle  } from 'react-icons/fi';
import { FaAsterisk } from 'react-icons/fa';
import {toast, ToastContainer} from "react-toastify";

function Register() {


    const NIC_RE = /^(?:\d{9}[VvXx]|(19|20)\d{10})$/;       // old: #########V/X, new: 12 digits
    const PASSPORT_RE = /^[A-Za-z]\d{7}$/;                  // 1 letter + 7 digits
    const DL_RE = /^[A-Za-z]\d{7}[A-Za-z]?$/;               // letter + 7 digits [+ optional letter]

    const normalizeNic = (raw) =>
        String(raw || '')
            .trim()
            .replace(/\s+/g, '')
            .replace(/([vx])$/, (m) => m.toUpperCase());

    const normalizePassport = (raw) =>
        String(raw || '').trim().replace(/\s+/g, '').toUpperCase();

    const normalizeDL = (raw) =>
        String(raw || '').trim().replace(/[\s\-\/]+/g, '').toUpperCase();

    const detectNicKind = (nic) => {
        if (/^\d{9}[VvXx]$/.test(nic)) return 'old';
        if (/^(19|20)\d{10}$/.test(nic)) return 'new';
        return null;
    };

    // NIC day-of-year logic: 001–366 (male) or 501–866 (female)
    const nicLogicalCheck = (nic) => {
        const kind = detectNicKind(nic);
        if (!kind) return false;
        const ddd = parseInt(kind === 'old' ? nic.slice(2, 5) : nic.slice(4, 7), 10);
        return ((ddd >= 1 && ddd <= 366) || (ddd >= 501 && ddd <= 866));
    };

    // Convert day-of-year to month/day using a given year
    const doyToMonthDay = (year, day) => {
        const d = new Date(year, 0, 1);
        d.setDate(d.getDate() + (day - 1));
        return { month: d.getMonth() + 1, day: d.getDate() };
    };

// Decode NIC → { year, month, day, female } using entered DOB's year when needed
    const decodeNicDob = (nic, dobISO) => {
        const kind = detectNicKind(nic);
        if (!kind) return null;

        // Use the user's entered DOB to resolve leap years and (for old NIC) century
        const dob = dobISO ? new Date(dobISO) : null;
        if (!dob || Number.isNaN(dob.getTime())) return null;

        let year = kind === 'new'
            ? parseInt(nic.slice(0, 4), 10)                 // YYYY (new NIC)
            : dob.getFullYear();                            // infer century from entered DOB (old NIC)

        let ddd = parseInt(kind === 'old' ? nic.slice(2, 5) : nic.slice(4, 7), 10);
        const female = ddd >= 500;
        const dayOfYear = female ? ddd - 500 : ddd;       // 1..366

        const { month, day } = doyToMonthDay(year, dayOfYear);
        return { year, month, day, female };
    };


    const sanitizeId = (type, value) => {
        switch (type) {
            case 'NIC': return normalizeNic(value);
            case 'Passport': return normalizePassport(value);
            case 'Driving License': return normalizeDL(value);
            default: return String(value || '').trim();
        }
    };

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const RequiredMark = () =>
        <FaAsterisk color="red"
                    size="0.3em"
                    style={{ marginLeft: '1px',
                        position: 'relative', top: '-0.3em' }} />;


    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        idType: '' ,
        idNumber: '',
        file: null,
        registered_date: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => {
            if (name === 'idNumber') {
                const sanitized = sanitizeId(prev.idType, value);
                return { ...prev, [name]: sanitized };
            }
            return { ...prev, [name]: files ? files[0] : value };
        });
    };

    const validateForm = async () => {
        const errors = {};
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        else if (!/^[A-Za-z]{3,}$/.test(formData.firstName))  errors.firstName = 'Must be at least 3 letters, no spaces or symbols';

        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        else if (!/^[A-Za-z]{3,}$/.test(formData.lastName))  errors.lastName = 'Must be at least 3 letters, no spaces or symbols';

        if (!formData.dob) {
            errors.dob = 'Date of birth is required';
        } else {
            const today = new Date();
            const dobDate = new Date(formData.dob);

            // Calculate age in years
            let age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }

            if (dobDate >= today) {
                errors.dob = 'Date of birth must be in the past';
            } else if (age < 18) {
                errors.dob = 'You must be at least 18 years old';
            }
        }

        const validGenders = ['Female', 'Male', 'Other'];
        if (!validGenders.includes(formData.gender)) {
            errors.gender = 'Please select a valid gender';
        }
        if (!/^7\d{8}$/.test(formData.phone)) errors.phone = 'Phone number must start with 7 and be 9 digits (e.g., 750000000)';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
        if (!formData.address.trim()) errors.address = 'Address is required';
        if (!formData.idType || !['NIC', 'Passport', 'Driving License'].includes(formData.idType)) {
            errors.idType = 'Select a valid ID type';
        }
        if (!formData.idNumber.trim()) {
            errors.idNumber = 'ID number is required';
        }

        const idNumber = sanitizeId(formData.idType, formData.idNumber);

        if (!idNumber) {
            errors.idNumber = 'ID number is required';
        } else if (formData.idType === 'NIC') {
            if (!NIC_RE.test(idNumber)) {
                errors.idNumber = 'NIC must be 9 digits + V/X, or 12 digits';
            } else if (!nicLogicalCheck(idNumber)) {
                errors.idNumber = 'NIC day-of-year segment is invalid';
            } else if (formData.dob) {
                // Compare NIC’s encoded DOB to the entered DOB
                const decoded = decodeNicDob(idNumber, formData.dob);
                if (!decoded) {
                    errors.idNumber = 'Unable to read date from NIC';
                } else {
                    const dob = new Date(formData.dob);
                    const dobMonth = dob.getMonth() + 1;
                    const dobDay = dob.getDate();
                    const dobYear = dob.getFullYear();

                    // For new 12-digit NIC: year must match exactly
                    if (/^(19|20)\d{10}$/.test(idNumber) && decoded.year !== dobYear) {
                        errors.idNumber = 'NIC birth year does not match Date of Birth';
                    } else if (decoded.month !== dobMonth || decoded.day !== dobDay) {
                        errors.idNumber = 'NIC date segment (month/day) does not match Date of Birth';
                    }
                }
            }

        } else if (formData.idType === 'Passport') {
            if (!PASSPORT_RE.test(idNumber)) {
                errors.idNumber = 'Passport must be 1 letter + 7 digits (e.g., N1234567)';
            }
        } else if (formData.idType === 'Driving License') {
            if (!DL_RE.test(idNumber)) {
                errors.idNumber = 'Driving Licence must be letter + 7 digits (optional trailing letter)';
            }
        }

        if (!errors.email) {
            try {
                const emailCheckRes = await fetch(`http://localhost:8080/api/v1/visitor/check-email?email=${encodeURIComponent(formData.email)}`);
                const emailCheck = await emailCheckRes.json();
                if (emailCheck.exists) {
                    errors.email = 'Email already exists';
                }
            } catch {
                // optionally handle fetch error
            }
        }

        if (!errors.idNumber) {
            try {
                const idCheckRes = await fetch(`http://localhost:8080/api/v1/visitor/check-idnumber?idNumber=${encodeURIComponent(formData.idNumber)}`);
                const idCheck = await idCheckRes.json();
                if (idCheck.exists) {
                    errors.idNumber = 'ID number already exists';
                }
            } catch {

            }
        }
        if (!formData.file) errors.file = 'ID file upload is required';
        else if (!['image/jpeg', 'image/png', 'application/pdf'].includes(formData.file.type)) {
            errors.file = 'Only JPEG, PNG, or PDF files allowed';
        } else if (formData.file.size > 5 * 1024 * 1024) {
            errors.file = 'File must be under 5MB';
        }

        return errors;
    };





    const handleSubmit =  async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        const validationErrors = await validateForm();
        try {

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                setLoading(false);
                return;
            }

            const idResponse = await fetch('http://localhost:8080/api/v1/visitor/generate-visitor-id', {
                method: 'GET'
            });
            const idResult = await idResponse.json();

            if (!idResponse.ok || !idResult.success) {
                throw new Error('Failed to generate visitor ID');
            }

            const newVisitorId = idResult.visitor_id;

            const blacklist_status = 'No';

            const payload = {
                visitor_id: newVisitorId,
                first_name: formData.firstName,
                last_name: formData.lastName,
                id_type: formData.idType,
                nic: sanitizeId(formData.idType, formData.idNumber),
                address: formData.address,
                registered_date: formData.registered_date,
                date_of_birth: formData.dob,
                file: formData.file ? formData.file.name : null, // Assuming you want to send the file name
                email: formData.email,
                contact_number: formData.phone,
                blacklist_status,
            };


            const response = await fetch('http://localhost:8080/api/v1/visitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok && result.success) {
                 localStorage.setItem('visitor_id', newVisitorId);
    localStorage.setItem('visitor_name', `${formData.firstName}`); 
    setIsRegistered(true);
            } else {
                toast.error(result.message || 'Failed to register');
            }
        } catch (err) {
            console.error(err);
            toast.error('Something went wrong while registering.');
        }finally {
            setLoading(false);    }

    };

    const renderFieldErrorIcon = (field) => (
        errors[field] && (
            <div className="tooltip-container">
                <FiAlertCircle className="error-icon" />
                <span className="tooltip-text">{errors[field]}</span>
            </div>
        )
    );

    return (
        <div className="register-page">
            <div className="register-header">
                {!isRegistered && <Link to="/" className="back-arrow">←</Link>}
                <span className="company-name">☁ Company Name</span>
            </div>

            {!isRegistered ? (
                <>
                    <h2 className="form-title">Registration Details</h2>
                    <form className="register-form" onSubmit={handleSubmit}>

                        <div className="form-row">
                            <div className="form-column">
                                <label>First Name<RequiredMark /> {renderFieldErrorIcon('firstName')}</label>
                                <input type="text" id="firstName" name="firstName" onChange={handleChange}  />
                            </div>
                            <div className="form-column">
                                <label>Last Name<RequiredMark /> {renderFieldErrorIcon('lastName')}</label>
                                <input type="text" id="lastName" name="lastName" onChange={handleChange}  />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-column">
                                <label>Date of Birth<RequiredMark /> {renderFieldErrorIcon('dob')}</label>
                                <input type="date" id="dob" name="dob" onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="form-column">
                                <label htmlFor="gender">Gender<RequiredMark /> {renderFieldErrorIcon('gender')}</label>
                                <select id="gender" name="gender" onChange={handleChange} value={formData.gender}>
                                    <option value="" disabled hidden>Select an option</option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-column">
                                <label>Phone<RequiredMark /> {renderFieldErrorIcon('phone')}</label>
                                <input type="text" id="phone" name="phone" onChange={handleChange} placeholder={'7XXXXXXXX'}  />
                            </div>
                            <div className="form-column">
                                <label>Email<RequiredMark /> {renderFieldErrorIcon('email')}</label>
                                <input type="email" id="email" name="email" onChange={handleChange}  />
                            </div>
                        </div>

                        <div className="form-row single">
                            <div className="form-column" style={{ width: '100%' }}>
                                <label>Address<RequiredMark /> {renderFieldErrorIcon('address')}</label>
                                <input type="text" id="address" name="address" onChange={handleChange}  />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-column">
                                <label htmlFor="idType">
                                    ID Type<RequiredMark /> {renderFieldErrorIcon('idType')}
                                </label>
                                <select id="idType" name="idType" onChange={handleChange} value={formData.idType}>
                                    <option value="" disabled hidden>Select an option</option>
                                    <option>NIC</option>
                                    <option>Passport</option>
                                    <option>Driving License</option>
                                </select>
                            </div>
                            <div className="form-column">
                                <label>ID Number<RequiredMark /> {renderFieldErrorIcon('idNumber')}</label>
                                <input type="text" id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleChange} />
                                <small className="hint">
                                    {formData.idType === 'NIC' && 'Old: #########V/X, New: 12 digits'}
                                    {formData.idType === 'Passport' && 'Format: Letter + 7 digits (e.g., N1234567)'}
                                    {formData.idType === 'Driving License' && 'Format: Letter + 7 digits [+ optional letter]'}
                                </small>
                            </div>
                        </div>

                        <div className="form-row file-upload">
                            <label>Upload ID <RequiredMark />{renderFieldErrorIcon('file')}</label>
                            <input type="file" id="file" name="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleChange} />
                            <p className="file-note">Accepted file types: JPEG, PDF, PNG</p>
                        </div>

                        <div className="submit-wrapper">
                            <button type="submit" className="submit-btn">Submit</button>
                        </div>

                    </form>
                </>
            ) : (
                <div className="success-card">
                    <span className="success-icon">✔️</span>
                    <h3>Registration Successful!</h3>
                    <p>You can now log in to your account to access your dashboard.</p>
                    <Link to="/Visitor/dashboard" className="continue-btn">Continue</Link>

                </div>
            )}
             <ToastContainer/>
        </div>
    );
}

export default Register;



