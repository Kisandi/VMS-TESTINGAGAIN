import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import RoleSelection from './RoleSelection';
import AdminLogin from './Admin/AdminLogin';
import AdminDashboard from './Admin/AdminDashboard';
import Login from './Visitor/Login'; // Visitor login
import Register from './Visitor/Register';
import Dashboard from './Visitor/Dashboard';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import OtpVerification from "./Visitor/OtpVerification";
import ReceptionistLogin from './Receptionist/ReceptionistLogin';
import ReceptionistDashboard from './Receptionist/ReceptionistDashboard'
import HostLogin from "./Host/HostLogin";
import HostDashboard from "./Host/HostDashboard";
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Role Selection */}
        <Route path="/" element={<RoleSelection />} />

        {/* Visitor */}
        <Route path="Visitor/Login" element={<Login />} />
        <Route path="Visitor/Register" element={<Register />} />
        <Route path="Visitor/Dashboard" element={<Dashboard />} />
        <Route path="Visitor/verify-otp" element={<OtpVerification />} />

        {/* Admin */}
        <Route path="/Admin/AdminLogin" element={<AdminLogin />} />
        <Route path="/Admin/AdminDashboard" element={<AdminDashboard />} />

        {/*Receptionist*/}
        <Route path="/Receptionist/ReceptionistLogin" element={<ReceptionistLogin />} />
        <Route path="/Receptionist/ReceptionistDashboard" element={<ReceptionistDashboard />} />

        {/*Host*/}
        <Route path="/Host/HostLogin" element={<HostLogin />} />
        <Route path="/Host/HostDashboard" element={<HostDashboard />} />


        <Route path="/forgot-password/:role" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>

    </Router>

  );
}

export default App;
