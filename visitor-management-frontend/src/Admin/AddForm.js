import React, {useEffect, useState} from "react";
import DepartmentSelect from "./DepartmentSelect";
import { Eye, EyeOff } from 'lucide-react';
import './AdminDashboard.css';

const AddForm = ({ onClose, onSave }) => {
    const [firstname, setFirstName] = useState('');
    const [lastname, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const[password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [position, setPosition] = useState('');
    const [department, setDepartment] = useState('');
    const [departments, setDepartments] = useState([]);
    const [userType, setUserType] = useState('');
    const [userTypes, setUserTypes] = useState([]);
    const [userTypesSelected, setUserTypesSelected] = useState([]);
    const [errors, setErrors] = useState({});
    const [departmentsSelected, setDepartmentsSelected] = useState([]);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Fetch departments on component mount
        fetch('http://localhost:8080/api/v1/department') // Adjust URL if needed
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDepartments(data.departments);
                } else {
                    console.error('Failed to load departments');
                }
            })
            .catch(err => console.error('Error fetching departments:', err));
    }, []);
    useEffect(() => {
        // Auto-generate username when name is typed (use first word of name)
        const firstWord = firstname.trim().split(' ')[0];
        if (firstWord) {
            setUsername(firstWord.toLowerCase());
        }
    }, [firstname]);
    useEffect(() => {
        console.log("Fetching user types...");
        fetch('http://localhost:8080/api/v1/userTypes') // Adjust this if your endpoint is different
            .then(res => res.json())
            .then(data => {
                console.log("User types response:", data);
                if (data.success) {
                    setUserTypes(data.userTypes); // Assuming it returns `userTypes`
                } else {
                    console.error('Failed to load user types');
                }
            })
            .catch(err => console.error('Error fetching user types:', err));
    }, []);

    const toggleUserType = (id) => {
        setUserTypesSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const validate = () => {
        const newErrors = {};

        if (!firstname.trim()) newErrors.firstname = 'First name is required';
        if (!lastname.trim()) newErrors.lastname = 'Last name is required';
        if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (!phone || !/^\d{10}$/.test(phone)) newErrors.phone = 'Enter a valid 10-digit phone number';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        if (!position.trim()) newErrors.position = 'Position is required';
        if (userTypesSelected.length === 0) newErrors.userTypes = 'Select at least one role';
        if (departmentsSelected.length === 0) newErrors.departments = 'Please select at least one department';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onSave({ first_name: firstname,last_name: lastname, username, password, phone, email, position, department_ids: departmentsSelected,  user_type_ids: userTypesSelected});
    };

    return (
        <form onSubmit={handleSubmit} className="add-form-modal">
            <button className="close-btn" type="button" onClick={onClose}>×</button>
            <h3>Add User</h3>
            <div className="form-row">
                <div className="form-group">
                    <label>First Name <span className="required">*</span></label>
                    <input type="text" value={firstname} onChange={e => setFirstName(e.target.value)}  />
                    {errors.firstname && <div className="error-msg">{errors.firstname}</div>}
                </div>
                <div className="form-group">
                    <label>Last Name <span className="required">*</span></label>
                    <input type="text" value={lastname} onChange={e => setLastName(e.target.value)}  />
                    {errors.lastname && <div className="error-msg">{errors.lastname}</div>}
                </div>

            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Username <span className="required">*</span></label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} disabled  />
                </div>
                <div className="form-group">
                    <label>Password <span className="required">*</span></label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <span className="toggle-icon" onClick={() => setShowPassword(prev => !prev)}>
        {showPassword ? (
            <EyeOff size={18} />
        ) : (
            <Eye size={18} />
        )}
      </span>
                    </div>
                    {errors.password && <div className="error-msg">{errors.password}</div>}
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Phone <span className="required">*</span></label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)}  />
                    {errors.phone && <div className="error-msg">{errors.phone}</div>}
                </div>
                <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}  />
                    {errors.email && <div className="error-msg">{errors.email}</div>}

                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Position <span className="required">*</span></label>
                    <input type="text" value={position} onChange={e => setPosition(e.target.value)}  />
                    {errors.position && <div className="error-msg">{errors.position}</div>}
                </div>
                <div className="form-group">
                    {/*<label>Department <span className="required">*</span></label>*/}
                    <DepartmentSelect
                        departments={departments}
                        selectedDepartments={departmentsSelected}
                        setSelectedDepartments={setDepartmentsSelected}
                        error={errors.departments}
                    />


                    {errors.department && <div className="error-msg">{errors.department}</div>}
                </div>


            </div>

            <div >
                <div className="label-text">User Roles:</div>
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
                {errors.userTypes && <span>{errors.userTypes}</span>}
            </div>

            <div className="form-actions">
                <button type="submit" className="submit-btn">Add</button>
            </div>
        </form>

    );
};
export default AddForm;