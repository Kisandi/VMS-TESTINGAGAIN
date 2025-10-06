import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ReceptionistDashboard.css';
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Visitors() {
    const [subTab, setSubTab] = useState('current');
    const [visitors, setVisitors] = useState([]);
    const [search, setSearch] = useState('');
    const [showRfidModal, setShowRfidModal] = useState(false);
    const [rfidInput, setRfidInput] = useState('');
    const [selectedVisitor, setSelectedVisitor] = useState(null);

    // Fetch visitor data when subTab changes
   useEffect(() => {
    (async () => {
        try {
            const endpoint = subTab;
            const res = await fetch(`http://localhost:8080/api/v1/checkInOut/${endpoint}`);
            const result = await res.json();

            console.log("Subtab:", subTab);
            console.log("Raw data from API:", result.data);

            if (result.success) {
                const formatted = result.data.map((v, index) => ({
                    id: v?.Visitor?.visitor_id || v?.visitor_id || v?.Visitor?.nic || `N/A-${index + 1}`,
                    appointmentId: v?.appointment?.id || v?.rfid_token?.appointment?.id || null,
                    fullName: `${v?.Visitor?.first_name || ''} ${v?.Visitor?.last_name || ''}`.trim() || v?.full_name || `Visitor-${index + 1}`,
                    purpose: v?.appointment?.purpose || v?.purpose || '-',
                    host: `${v?.appointment?.user?.first_name || ''} ${v?.appointment?.user?.last_name || v?.user?.first_name || ''} ${v?.user?.last_name || ''}`.trim() || '-',
                    checkInTime: v?.checkin_time ? new Date(v.checkin_time).toLocaleString() : '-',
                    checkOutTime: v?.checkout_time ? new Date(v.checkout_time).toLocaleString() : '-',
                    requestedTime: v?.requested_date_time ? new Date(v.requested_date_time).toLocaleString() : '-',
                    duration: v?.duration || '-',
                    location: v?.location || 'Reception',
                    status: v?.checkout_time ? 'Checked Out' : 'Checked In',
                    blacklist: v?.blacklist ? 'Yes' : 'No',
                    comments: v?.appointment?.comment || '-',
                    date: v?.date ? new Date(v.date).toLocaleDateString() : '-',
                }));

                setVisitors(formatted);
            } else {
                setVisitors([]);
            }
        } catch (err) {
            console.error("Fetch visitors error:", err);
            setVisitors([]);
        }
    })();
}, [subTab]);

    const filteredVisitors = visitors.filter(v =>
        v.fullName.toLowerCase().includes(search.toLowerCase()) ||
        v.id.toString().toLowerCase().includes(search.toLowerCase())
    );


    const getColumns = () => {
        const baseColumns = [
            { name: 'ID', selector: row => row.id, sortable: true },
            { name: 'Full Name', selector: row => row.fullName },
            { name: 'Purpose', selector: row => row.purpose },
            { name: 'Host', selector: row => row.host },
        ];

        if (subTab === 'upcoming') {
            return [
                ...baseColumns,
                { name: 'Requested Time', selector: row => row.requestedTime },
                { name: 'Duration', selector: row => row.duration }
            ];
        } else if (subTab === 'current') {
            return [
                ...baseColumns,
                { name: 'Check-In', selector: row => row.checkInTime },
                { name: 'Location', selector: row => row.location },
                {
                    name: 'Status',
                    selector: row => row.status,
                    cell: row => (
                        <span className={row.status === 'Checked Out' ? 'status-out' : 'status-in'}>
                            {row.status}
                        </span>
                    )
                },
                {
                    name: 'Action',
                    cell: row => (
                        <button
                            onClick={() => {
                                console.log('Setting selected visitor:', row.id, row.appointmentId);
                                setSelectedVisitor({ id: row.id});
                                setRfidInput('');
                                setShowRfidModal(true);
                            }}

                            disabled={row.status === 'Checked Out'}
                        >
                            Check Out
                        </button>
                    )
                }
            ];
        } else if (subTab === 'past') {
            return [
                ...baseColumns,
                { name: 'Check-In', selector: row => row.checkInTime },
                { name: 'Check-Out', selector: row => row.checkOutTime },
                { name: 'Blacklist', selector: row => row.blacklist },
                { name: 'Comments', selector: row => row.comments }
            ];
        }

        return baseColumns;
    };

    const confirmCheckout = async () => {
        const trimmedRFID = rfidInput.trim();
        console.log('Confirm Checkout called with:', { trimmedRFID });

        if (!trimmedRFID) {
            toast.error("RFID is missing or invalid.");
            return;
        }




        try {
            const res = await fetch(`http://localhost:8080/api/v1/checkInOut/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rfid: rfidInput
                })
            });

            const result = await res.json();

            if (result.success) {
                toast.success("Visitor checked out successfully!");
                setVisitors(prev =>
                    prev.map(v =>
                        v.id === selectedVisitor.id
                            ? { ...v, status: 'Checked Out', checkOutTime: new Date().toLocaleString() }
                            : v
                    )
                );
            } else {
                toast.error("Checkout failed.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error while checking out.");
        } finally {
            setShowRfidModal(false);
        }
    };


    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`${subTab.charAt(0).toUpperCase() + subTab.slice(1)} Visitors Report`, 14, 16);

        autoTable(doc, {
            startY: 20,
            head: [getColumns().map(c => c.name)],
            body: filteredVisitors.map(v =>
                getColumns().map(c => typeof c.selector === 'function' ? c.selector(v) : '')
            ),
        });

        doc.save(`${subTab}_visitors.pdf`);
    };

    const tabs = [
        { key: 'current', label: 'Current Visitors' },
        { key: 'upcoming', label: 'Upcoming Visitors' },
        { key: 'past', label: 'Past Visitors' }
    ];




    return (
        <div className="visitors">
            <div className="visitor-subtabs">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`visitor-subtab-button ${subTab === t.key ? 'active' : ''}`}
                        onClick={() => setSubTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="top-bar">
                <input
                    placeholder="Search by ID or name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button className="export-btn" onClick={exportPDF}>📄 Export PDF</button>
            </div>

            <DataTable
                columns={getColumns()}
                data={filteredVisitors}
                pagination
                striped
                highlightOnHover
                noDataComponent="No visitors found."
            />

            {showRfidModal && (
                <div className="rfid-modal">
                    <div className="rfid-modal-content">
                        <h3>Enter or Scan RFID</h3>
                        <input
                            type="text"
                            value={rfidInput}
                            onChange={e => setRfidInput(e.target.value)}
                            placeholder="RFID code"
                        />
                        <div className="rfid-modal-actions">
                            <button onClick={() => confirmCheckout()}>Confirm</button>
                            <button onClick={() => setShowRfidModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer />
        </div>
    );
}
