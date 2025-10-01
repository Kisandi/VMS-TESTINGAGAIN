import React, { useState, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {toast, ToastContainer} from 'react-toastify';

export default function MyVisitors() {
    const [subTab, setSubTab] = useState('current');
    const [visitors, setVisitors] = useState([]);
    const [search, setSearch] = useState('');
    const [overstayVisitor, setOverstayVisitor] = useState(null);
    const [showOverstayPopup, setShowOverstayPopup] = useState(false);
    const [extensionMinutes, setExtensionMinutes] = useState(0);
    const [showExtensionInput, setShowExtensionInput] = useState(false);
    const endedVisitorIds = useRef(new Set());

    const hostId = JSON.parse(localStorage.getItem('user'))?.user_id || null;

    const fetchVisitors = async () => {
        if (!hostId) return;

        try {
            const res = await fetch(`http://localhost:8080/api/v1/checkInOut/host/${hostId}?type=${subTab}`);
            const result = await res.json();

            if (result.success) {
                endedVisitorIds.current = new Set();
                const accessRes = await fetch('http://localhost:8080/api/v1/access');
                const accessLogs = (await accessRes.json()).data || [];

                const latestAccessMap = {};
                for (const log of accessLogs) {
                    if (log.status !== 'allowed') continue;
                    const tokenId = log.token_id;
                    if (!latestAccessMap[tokenId] || new Date(log.createdAt) > new Date(latestAccessMap[tokenId].createdAt)) {
                        latestAccessMap[tokenId] = log;
                    }
                }

                const formatted = result.data.map((v, index) => {

                    const isUpcoming = subTab === 'upcoming';
                    const appointment = isUpcoming ? v : (v.Appointment || v.appointment || v.rfid_token?.Appointment || {});
                    const visitor = v.Visitor || v.visitor || {};



                    const fullName = `${visitor.first_name || ''} ${visitor.last_name || ''}`.trim();
                    const token = v.rfid_token || {};
                    const tokenId = token.token_id || v.token_id || `UNKNOWN-${index + 1}`;
                    const id = `${visitor.visitor_id}-${v.checkin_id || appointment.appointment_id || token.token_id || index}`;
                    const latestAccess = latestAccessMap[tokenId];


                    const status = v.manually_ended
                        ? 'Meeting Ended'
                        : v.checkout_time
                            ? 'Meeting Ended'
                            : v.checkin_time
                                ? 'Checked In'
                                : 'Not Arrived';


                    if (status === 'Meeting Ended') endedVisitorIds.current.add(id);

                    return {
                        id,
                        tokenId,
                        fullName,
                        purpose: appointment.purpose || 'N/A',
                        host:
                            v.Appointment?.user
                                ? `${v.Appointment.user.first_name} ${v.Appointment.user.last_name}`
                                : v.appointment?.user
                                    ? `${v.appointment.user.first_name} ${v.appointment.user.last_name}`
                                    : v.rfid_token?.Appointment?.user
                                        ? `${v.rfid_token.Appointment.user.first_name} ${v.rfid_token.Appointment.user.last_name}`
                                        : 'N/A',

                        checkInTime: v.checkin_time ? new Date(v.checkin_time).toLocaleString() : '-',
                        checkOutTime: v.checkout_time ? new Date(v.checkout_time).toLocaleString() : '-',
                        requestedTime: appointment.requested_date_time
                            ? new Date(appointment.requested_date_time).toLocaleString()
                            : '-',
                        duration: appointment.duration || '-',
                        endTime: appointment.end_time || null,
                        location: latestAccess?.location_name || "Reception",
                        status,
                        blacklist: v.blacklist ? 'Yes' : 'No',
                        comments: v.comments || '-',
                        date: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '-'
                    };
                });

                setVisitors(formatted);
            } else {
                setVisitors([]);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setVisitors([]);
        }
    };

    useEffect(() => {
        fetchVisitors();
        const interval = setInterval(fetchVisitors, 5000);
        return () => clearInterval(interval);
    }, [subTab, hostId]);

    const filteredVisitors = visitors.filter(v =>
        v.fullName.toLowerCase().includes(search.toLowerCase()) ||
        v.id.toLowerCase().includes(search.toLowerCase())
    );

    const isOverstayed = (visitor) => {
        if (!visitor.checkInTime || visitor.status === 'Checked Out') return false;
        if (!visitor.endTime) return false;

        const [hours, minutes, seconds] = visitor.endTime.split(':');
        const endDate = new Date();
        endDate.setHours(+hours, +minutes, +seconds || 0, 0);

        return new Date() > endDate;
    };

    const endVisit = async (visitor) => {
        try {
            const res = await fetch('http://localhost:8080/api/v1/checkInOut/end-meeting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokenId: visitor.tokenId })

            });
            console.log("Sending tokenId to backend:", visitor.tokenId);

            const result = await res.json();

            if (result.success) {
                endedVisitorIds.current.add(visitor.id);
                setVisitors(prev =>
                    prev.map(v =>
                        v.id === visitor.id ? { ...v, status: 'Meeting Ended' } : v
                    )
                );
                toast.success("Meeting manually ended");
                setShowOverstayPopup(false);
            } else {
                toast.error(result.message || "Failed to end meeting.");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Server error while ending meeting.");
        }
    };


    const extendStay = async (visitor, minutes) => {
        if (minutes <= 0) {
            toast.warning('Please enter a valid duration.');
            return;
        }

        try {
            const res = await fetch('http://localhost:8080/api/v1/checkInOut/extend-stay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokenId: visitor.tokenId, additionalMinutes: minutes })

            });
            const result = await res.json();

            if (result.success) {
                toast.success(`Stay extended by ${minutes} minutes.`);
                const newEndTime = result.newEndTime; // assuming backend returns updated time

                setVisitors(prev =>
                    prev.map(v =>
                        v.id === visitor.id
                            ? { ...v, endTime: newEndTime }
                            : v
                    )
                );

                setShowOverstayPopup(false);
            } else {
                toast.error('Failed to extend stay.');
            }
        } catch (error) {
            console.error('Extend stay error:', error);
            toast.error('Failed to extend stay.');
        }
    };

    const getColumns = () => {
        const baseColumns = [
            { name: 'ID', selector: row => row.id, sortable: true },
            { name: 'Full Name', selector: row => row.fullName },
            { name: 'Purpose', selector: row => row.purpose },
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
                { name: 'Host', selector: row => row.host },
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
                    name: 'Actions',
                    cell: row => {
                        if (row.status !== 'Checked In' || row.checkout_time || row.manually_ended) {
                            return <span className="text-gray-400">No Action</span>;
                        }


                        const overstayed = isOverstayed(row);
                        const buttonLabel = overstayed ? 'Handle Overstay' : 'End Meeting';

                        return (
                            <button
                                onClick={() => {
                                    if (overstayed) {
                                        setOverstayVisitor(row);
                                        setShowOverstayPopup(true);
                                        setShowExtensionInput(false);
                                        setExtensionMinutes(0);
                                    } else {
                                        endVisit(row);
                                    }
                                }}
                            >
                                {buttonLabel}
                            </button>
                        );
                    }
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

        doc.save(`my_${subTab}_visitors.pdf`);
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

            {showOverstayPopup && overstayVisitor && (
                <div className="overstay-popup">
                    {!showExtensionInput ? (
                        <>
                            <p>Visitor <b>{overstayVisitor.fullName}</b> has overstayed. What would you like to do?</p>
                            <button onClick={() => endVisit(overstayVisitor)}>End Visit</button>
                            <button onClick={() => setShowExtensionInput(true)}>Extend Stay</button>
                            <button onClick={() => setShowOverstayPopup(false)}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <p>Extend stay duration (minutes):</p>
                            <input
                                type="number"
                                min="1"
                                value={extensionMinutes}
                                onChange={e => setExtensionMinutes(parseInt(e.target.value, 10) || 0)}
                            />
                            <button onClick={() => {
                                extendStay(overstayVisitor, extensionMinutes);
                                setShowOverstayPopup(false);
                            }}>Confirm</button>
                            <button onClick={() => setShowExtensionInput(false)}>Back</button>
                        </>
                    )}
                </div>
            )}
            <ToastContainer/>
        </div>
    );
}
