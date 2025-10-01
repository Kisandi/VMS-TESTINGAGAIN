import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import VisitorRequests from './VisitorRequests';
import Visitors from './Visitors';
import './ReceptionistDashboard.css';
import {FaSignOutAlt} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import {toast, ToastContainer} from "react-toastify";
import useSocket from "../hooks/useSocket";

function ReceptionistDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        registeredVisitors: 0,
        blacklistedVisitors: 0,
        approvedAppointmentsToday: 0,
        checkedInVisitors: 0,
    });
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();



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
                method: 'PATCH',
            });
            const result = await res.json();
            if (result.success) {
                setNotifications((prev) =>
                    prev.filter((note) => note.notification_id !== id)
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

    useSocket((newNotification) => {
        setNotifications((prev) => {
            const exists = prev.some((n) => n.notification_id === newNotification.notification_id);
            if (exists) return prev;
            return [newNotification, ...prev];
        });
    });

    useEffect(() => {
        fetchNotifications(); // initial load
    }, []);


    return (
        <div className="receptionist-dashboard">
            <aside className="sidebar">
                <h2>Receptionist Panel</h2>
                <ul>
                    <li className={activeTab==='dashboard'?'active':''} onClick={()=>setActiveTab('dashboard')}>Dashboard</li>
                    <li className={activeTab==='requests'?'active':''} onClick={()=>setActiveTab('requests')}>Requests</li>
                    <li className={activeTab==='visitors'?'active':''} onClick={()=>setActiveTab('visitors')}>Visitors</li>
                </ul>

                <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt /> Log Out
                </button>
            </aside>

            <main className="main-content">
                {activeTab === 'dashboard' && (
                    <>
                        <div className="header"><h1>Dashboard Overview</h1></div>
                        <div className="cards">
                            <div className="card approved">Total Registered Visitors <span>{stats.registeredVisitors}</span></div>
                            <div className="card blacklisted">Total Blacklisted Visitors <span>{stats.blacklistedVisitors}</span></div>
                            <div className="card approved">Today Approved Appointments <span>{stats.approvedAppointmentsToday}</span></div>
                            <div className="card arrived">Total Checked-in Visitors <span>{stats.checkedInVisitors}</span></div>
                        </div>
                        <div className="reports">
                            <button className="report-btn">📅 Monthly Visitor Report</button>
                            <button className="report-btn">📊 Weekly Visitor Report</button>
                        </div>
                    </>
                )}

                {activeTab === 'requests' && <VisitorRequests />}
                {activeTab === 'visitors' && <Visitors />}
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
                                    <div className="notification-time">
                                        {new Date(note.createdAt).toLocaleString()}
                                    </div>
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
            <ToastContainer/>
        </div>
    );
}
export default ReceptionistDashboard;