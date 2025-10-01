import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';
import { User, Shield, LogIn, CalendarCheck } from 'lucide-react';
import Login from "./Visitor/Login";


function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="role-selection">
      <h1>Welcome to the Visitor Management System</h1>
      <p>Select your login type:</p>
      <div className="role-cards">
        <div className="role-card" onClick={() => navigate('/Visitor/Login')}>
          <User size={36} className="role-icon" />
          <h2>Visitor</h2>
          <p>Register or check in as a visitor</p>
        </div>
        <div className="role-card" onClick={() => navigate('/Admin/AdminLogin')}>
          <Shield size={36} className="role-icon" />
          <h2>Admin</h2>
          <p>Manage system users and settings</p>
        </div>
        <div className="role-card" onClick={() => navigate('/Receptionist/Receptionistlogin')}>
          <LogIn size={36} className="role-icon" />
          <h2>Receptionist</h2>
          <p>Check-in guests and manage appointments</p>
        </div>
        <div className="role-card" onClick={() => navigate('/Host/HostLogin')}>
          <CalendarCheck size={36} className="role-icon" />
          <h2>Host</h2>
          <p>View your upcoming guest visits</p>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
