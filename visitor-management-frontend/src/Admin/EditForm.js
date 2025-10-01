import React, {useEffect, useState} from "react";
import DepartmentSelect from "./DepartmentSelect";
import { Eye, EyeOff } from 'lucide-react';

const EditForm = ({ user, onClose, onSave }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [position, setPosition] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [userTypes, setUserTypes] = useState([]);

    const [departmentsSelected, setDepartmentsSelected] = useState([]);
    const [userTypesSelected, setUserTypesSelected] = useState([]);
    const [errors, setErrors] = useState({});


    useEffect(() => {
        if (user) {
            console.log('EditForm received user:', user);
            // Assuming user object contains these fields individually or you fetch them separately
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setUsername(user.username || '');
            setPhone(user.phone || '');
            setEmail(user.email || '');
            setPassword(user.password || '');
            setPosition(user.position || '');
            setDepartmentsSelected(user.department_ids || []); // <-- changed here
            setUserTypesSelected(user.user_type_ids.map(id => String(id)) || []);

        }
    }, [user]);

    useEffect(() => {
        // Fetch departments
        fetch('http://localhost:8080/api/v1/department')
            .then(res => res.json())
            .then(data => {
                if (data.success) setDepartments(data.departments);
            })
            .catch(err => console.error('Failed to fetch departments:', err));

        // Fetch user types
        fetch('http://localhost:8080/api/v1/userTypes')
            .then(res => res.json())
            .then(data => {
                if (data.success) setUserTypes(data.userTypes);
            })
            .catch(err => console.error('Failed to fetch user types:', err));
    }, []);
    // const handleDepartmentsChange = (e) => {
    //     const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
    //     setDepartmentsSelected(selectedOptions);
    // };
    const toggleUserType = (id) => {
        setUserTypesSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const validate = () => {
        const newErrors = {};
        if (!firstName.trim()) newErrors.firstName = 'First name is required';
        if (!lastName.trim()) newErrors.lastName = 'Last name is required';
        if (password && password.length > 0 && password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (!phone || !/^\d{10}$/.test(phone)) newErrors.phone = 'Enter a valid 10-digit phone number';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        if (!position.trim()) newErrors.position = 'Position is required';
        if (departmentsSelected.length === 0) newErrors.departments = 'Please select at least one department';
        if (userTypesSelected.length === 0) newErrors.userTypes = 'Select at least one role';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            first_name: firstName,
            last_name: lastName,
            username, // Typically username is not editable? But included here.
            password: password || null, // Only send password if entered, else null or omit in backend
            contact: phone,
            email,
            position,
            department_ids: departmentsSelected,
            user_type_ids: userTypesSelected,
        });
    };


    return (
        <form onSubmit={handleSubmit} className="add-form-modal">
            <button className="close-btn" type="button" onClick={onClose}>×</button>
            <h3>Edit User</h3>

            <div className="form-row">
                <div className="form-group">
                    <label>First Name <span className="required">*</span></label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    {errors.firstName && <div className="error-msg">{errors.firstName}</div>}
                </div>
                <div className="form-group">
                    <label>Last Name <span className="required">*</span></label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                    {errors.lastName && <div className="error-msg">{errors.lastName}</div>}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={username} disabled />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password || '********'}
                        readOnly
                        className="password-input"
                    />
                    <span
                        className="toggle-icon1"
                        onClick={() => setShowPassword(prev => !prev)}
                    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </span>
                    {errors.password && <div className="error-msg">{errors.password}</div>}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Phone <span className="required">*</span></label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} />
                    {errors.phone && <div className="error-msg">{errors.phone}</div>}
                </div>
                <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    {errors.email && <div className="error-msg">{errors.email}</div>}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Position <span className="required">*</span></label>
                    <input type="text" value={position} onChange={e => setPosition(e.target.value)} />
                    {errors.position && <div className="error-msg">{errors.position}</div>}
                </div>
            </div>

            <div className="form-group">
                <DepartmentSelect
                    departments={departments}
                    selectedDepartments={departmentsSelected}
                    setSelectedDepartments={setDepartmentsSelected}
                    error={errors.departments}
                />

                {errors.departments && <div className="error-msg">{errors.departments}</div>}
            </div>

            <div>
                <label>User Roles:</label>
                <div className="checkbox-group">
                    {userTypes.map(type => (
                        <label key={type.user_type_id}>
                            <input
                                type="checkbox"
                                value={type.user_type_id}
                                checked={userTypesSelected.includes(type.user_type_id)}
                                onChange={() => toggleUserType(type.user_type_id)}
                            />
                            {type.user_type}
                        </label>
                    ))}
                </div>
                {errors.userTypes && <div className="error-msg">{errors.userTypes}</div>}
            </div>

            <div className="form-actions">
                <button type="submit" className="submit-btn">Save</button>
            </div>
        </form>
    );
};

export default EditForm;