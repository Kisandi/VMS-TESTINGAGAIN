import React, { useState , useEffect} from 'react';
import './AdminDashboard.css';
import { Bell} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CurrentVisitors from './CurrentVisitors';
import UpcomingVisitors from './UpcomingVisitors';
import PastVisitors from './PastVisitors';
import BlacklistVisitors from './BlacklistVisitors';
import AccessControl from "./AccessControl";
import Users from './Users';
import Department from "./Department";
import { useNavigate } from 'react-router-dom';
import {FaSignOutAlt} from "react-icons/fa";

function AdminDashboard() {

  // Controls which tab is currently active
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    registeredVisitors: 0,
    blacklistedVisitors: 0,
    approvedAppointmentsToday: 0,
    checkedInVisitors: 0,
  });
  const navigate = useNavigate();
  // ===================== 🧾 PDF EXPORT =====================

  // Export data to PDF using jsPDF & autoTable
  const exportPDF = (data, columns, title) => {
    const doc = new jsPDF();
    doc.text(title, 14, 10);
    autoTable(doc, {
      head: [columns],
      body: data,
    });
    doc.save(`${title}.pdf`);
  };

  // Download full departments list as PDF from backend
  const downloadDepartmentsPDF = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/department/exportAllDepartments');
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'departments.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const downloadHostsPDF = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/user/exportAllHosts');
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hosts.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

   const [visitorSubTab, setVisitorSubTab] = useState('current');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboardStats();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/admin/dashboard-stats');
      const result = await res.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/notification/live');
        const result = await res.json();
        if (result.success) {
          setNotifications(result.data);
        } else {
          toast.error('Failed to load notifications');
        }
      } catch (err) {
        toast.error('Failed to load notifications');
        console.error('Error fetching admin notifications:', err);
      }
    };

  const markNotificationAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/notification/markAsRead/${id}`, {
        method: 'POST',
      });
      const result = await res.json();
      if (result.success) {
        // Update state to mark notification read locally
        setNotifications((prev) =>
            prev.map((note) => (note.notification_id === id ? { ...note, read: true } : note))
        );
        toast.success('Notification marked as read');
      } else {
        toast.error('Failed to mark as read');
      }
    } catch (error) {
      toast.error('Failed to mark as read');
      console.error(error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/notification/markAllAsRead`, {
        method: 'POST',
      });
      const result = await res.json();
      if (result.success) {
        setNotifications((prev) => prev.map((note) => ({ ...note, read: true })));
        toast.success('All notifications marked as read');
      } else {
        toast.error('Failed to mark all as read');
      }
    } catch (error) {
      toast.error('Failed to mark all as read');
      console.error(error);
    }
  };

  const handleLogout = () => {
    // Clear any auth tokens or user data here if needed
    localStorage.clear();
    navigate('/');
  };


  return (
      <div className="admin-dashboard">
        <aside className="sidebar">
          <h2>Admin Panel</h2>
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</li>
            <li className={activeTab === 'host' ? 'active' : ''} onClick={() => setActiveTab('host')}>Users</li>
            <li className={activeTab === 'departments' ? 'active' : ''} onClick={() => setActiveTab('departments')}>Departments</li>
            <li className={activeTab === 'visitors' ? 'active' : ''} onClick={() => setActiveTab('visitors')}>Visitors</li>
            <li className={activeTab === 'accesscontrol' ? 'active' : ''} onClick={() => setActiveTab('accesscontrol')}>Access Control</li>

          </ul>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Log Out
          </button>
        </aside>

        <main className="main-content">
          {activeTab === 'dashboard' && (
              <>
              <div className="dashboard-tab-background">
                <div className="dashboard-overlay">

                <div className="header"><h1>Dashboard Overview</h1></div>
                <div className="cards">
                  <div className="card approved">Total Registered Visitors <span>{stats.registeredVisitors}</span></div>
                  <div className="card blacklisted">Total Blacklisted Visitors <span>{stats.blacklistedVisitors}</span></div>
                  <div className="card approved">Today Approved Appointments <span>{stats.approvedAppointmentsToday}</span></div>
                  <div className="card arrived">Total Checked-in Visitors <span>{stats.checkedInVisitors}</span></div>
                </div>

                </div>
              </div>
              </>
          )}

          {activeTab === 'host' && <Users />}
          {activeTab === 'departments' && <Department />}



          {activeTab === 'visitors' && (
              <div className="tab-content">
                {/* Visitor Subtabs */}
                <div className="visitor-subtabs">
                  {['current', 'upcoming', 'past', 'blacklist'].map(tab => (
                      <button
                          key={tab}
                          onClick={() => setVisitorSubTab(tab)}
                          className={`visitor-subtab-button ${visitorSubTab === tab ? 'active' : ''}`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)} Visitors
                      </button>
                  ))}
                </div>

                {/* Visitor Subtab Content */}
                <div className="visitor-subtab-content">
                  {visitorSubTab === 'current' && (
                      <div>
                        <CurrentVisitors />
                      </div>
                  )}

                  {visitorSubTab === 'upcoming' && (
                      <div>
                        <UpcomingVisitors/>
                      </div>
                  )}

                  {visitorSubTab === 'past' && (
                      <div>
                        <PastVisitors/>
                      </div>
                  )}

                  {visitorSubTab === 'blacklist' && (
                      <div>
                        <BlacklistVisitors/>
                      </div>
                  )}
                </div>
              </div>
          )}


          {activeTab === 'accesscontrol' && (
              <AccessControl />
          )}


        </main>

        <aside className="notification-panel">
          <div className="notification-header">
            <Bell size={20} />
            <h3>Notifications</h3>
            <button onClick={markAllAsRead} className="clear-all-btn">Mark All as Read</button>
          </div>
          <ul className="notifications-list">
            {notifications.length === 0 ? (
                <li>No new notifications</li>
            ) : (
                notifications.map((note) => (
                    <li
                        key={note.notification_id}
                        className={`notification-item ${note.read ? 'read' : 'unread'}`}
                        onClick={() => !note.read && markNotificationAsRead(note.notification_id)}
                    >


                      <div className="notification-content">
                        <div>{note.content}</div>
                      </div>

                      {!note.read && (
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(note.notification_id);
                              }}
                              className="mark-read-btn"
                              style={{
                                background: '#1d4ed8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontSize: '0.7rem'
                              }}
                          >
                            Mark as Read
                          </button>
                      )}
                    </li>

                ))
            )}
          </ul>
        </aside>

        <ToastContainer position="top-center" className='custom-toast' autoClose={1000} hideProgressBar='true'/>
      </div>
  );
}

export default AdminDashboard;
