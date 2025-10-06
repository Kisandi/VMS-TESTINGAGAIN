import React, { useState, useEffect } from 'react';
import {  Printer } from 'lucide-react';
import './ReceptionistDashboard.css';
import  generateRFIDTokenPDF from "./generateRFIDToken";
import 'react-toastify/dist/ReactToastify.css';
import DataTable from 'react-data-table-component';

import {toast, ToastContainer} from 'react-toastify';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import {FiCalendar} from "react-icons/fi";
import DatePicker from "react-datepicker";

export default function VisitorRequests() {
    const [subTab, setSubTab] = useState('pending');
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [printedMap, setPrintedMap] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);

    const exportRequestsPDF = (status) => {
        const doc = new jsPDF();

        const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

        const columns = [
            { header: 'ID', dataKey: 'nic' },
            { header: 'Full Name', dataKey: 'full_name' },
            { header: 'Purpose', dataKey: 'purpose' },
            { header: 'Requested Date', dataKey: 'date' },
            { header: 'Requested Time', dataKey: 'time' },
            { header: 'Duration', dataKey: 'duration' },
            { header: 'Host', dataKey: 'host' },
        ];

        const filteredData = data.filter(item => item.approval_status === status);

        const rows = filteredData.map(item => ({
            nic: item.nic,
            full_name: item.full_name,
            purpose: item.purpose,
            date: item.date,
            time: item.time,
            duration: item.duration || '',
            host: item.host || '',
        }));

        doc.text(`${capitalizedStatus} Appointment Requests`, 14, 15);

        autoTable(doc, {
            columns,
            body: rows,
            startY: 20,
            theme: 'striped',
            headStyles: { fillColor: [0, 123, 255] },
            styles: { fontSize: 10 },
            margin: { left: 14, right: 14 },
        });

        doc.save(`${status}_requests_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
        toast.success(`${capitalizedStatus} PDF downloaded.`);
    };

    // Fetch appointment data based on sub-tab selection
    useEffect(() => {
        fetch(`http://localhost:8080/api/v1/appointment/status?approval_status=${subTab}&search=${search}&page=${currentPage}&limit=${itemsPerPage}`)
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    let filtered = response.data || [];
                    // For approved tab, only show those with a token_id
                   if (subTab === 'approved') {
    let filtered = response.data || response.appointments || [];
    // ✅ Only show approved requests WITHOUT a token
    filtered = filtered.filter(row => !row?.token_id);
    setData(filtered);
} else {
    setData(response.data || []);
}

                    setData(filtered);
                } else {
                    console.error("API responded with error:", response.message);
                    setData([]);
                }
            })

            .catch(err => {
                console.error("Fetch error:", err);
                setData([]);
            });
    }, [subTab, search, currentPage]);

    useEffect(() => {
        const map = {};
        data.forEach(row => {
            if (row.rfid_token_issued && row.nic) {
                map[row.nic] = true;
            }
        });
        setPrintedMap(map);
    }, [data]);

    const handlePrint = async (row) => {
        if (printedMap[row.nic]) return;
        const requestedTime = new Date(row.requested_date_time); // Assuming this field is available in `row`
        const endTime = new Date(row.end_time);
        const now = new Date();

        if (now < requestedTime) {
            toast.error("You can only generate the RFID token after the appointment time.");
            return;
        }
        if (now > endTime) {
    toast.error("This appointment has already ended. RFID token cannot be issued.");
    return;
}
        try {
            console.log("Row object:", row);

            console.log("appointment_id:", row.appointment_id);
            console.log("visitor_id:", row.visitor_id);
            console.log("user_id:", row.user_id);

            const res = await fetch('http://localhost:8080/api/v1/rfid', {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: row.appointment_id,
                    visitor_id: row.visitor_id,
                    user_id: row.user_id
                })
            });

            const response = await res.json();

            if (response.success) {
                const visitor = response.visitor || {};
                await generateRFIDTokenPDF({
                    full_name: visitor.full_name || row.full_name,
                    token_id: response.token.token_id,
                    purpose: visitor.purpose || row.purpose,
                    host: visitor.host || row.host,
                    host_position: response.host?.position || 'Host',
                    meeting_point: response.meeting_point || response.token?.meeting_point || 'Reception'
                });
                setPrintedMap(prev => ({ ...prev, [row.nic]: true }));
                setData(prevData => prevData.filter(d => d.nic !== row.nic));
                toast.success("RFID Token issued and moved to current visitors.");

            }
            else {
                toast.error(response.message || "RFID generation failed.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Server error while generating RFID token.");
        }
    };

    const tabs = [
        { key: 'pending', label: 'Pending Requests' },
        { key: 'approved', label: 'Approved Requests' },
        { key: 'declined', label: 'Declined Requests' }
    ];


    const commonColumns = [
        {
            name: 'ID',
            selector: row => row.nic,
            sortable: true
        },
        {
            name: 'Full Name',
            selector: row => row.full_name,
            sortable: true
        },
        {
            name: 'Purpose',
            selector: row => row.purpose,
            sortable: true
        },
        {
            name: 'Host',
            selector: row => row.host,
            sortable: true
        }
    ];

    const pendingColumns = [
        ...commonColumns.slice(0, 3),
        {
            name: 'Date',
            selector: row => row.date
        },
        {
            name: 'Time',
            selector: row => row.time
        },
        {
            name: 'Duration',
            selector: row => row.duration
        },
        {
            name: 'Department',
            selector: row => row.department
        },

        commonColumns[3]
    ];

    const approvedColumns = [
        ...commonColumns,
        {
            name: 'Requested Date & Time',
            selector: row => row.requested_date_time ? new Date(row.requested_date_time).toLocaleString() : '-',
            sortable: true,
        },
        {
            name: 'Meeting Location',
            selector: row => row.location,
            sortable: true,
        },
        {
            name: 'Issue RFID',
            cell: row =>
                printedMap[row.nic] ? (
                    <span className="printed-text">Printed</span>
                ) : (
                    <button className="print-btn" onClick={() => handlePrint(row)} title="Print RFID">
                        <Printer size={16} />
                    </button>
                )
        }
    ];

    const declinedColumns = [
        ...commonColumns,
        {
            name: 'Department',
            selector: row => row.department,
            sortable: true,
        },
        {
            name: 'Comment',
            selector: row => row.comment,
            sortable: true,
        },
        {
            name: 'Requested Date & Time',
            selector: row => row.requested_date_time ? new Date(row.requested_date_time).toLocaleString() : '-',
            sortable: true,
        },
    ];

    const columns =
        subTab === 'pending' ? pendingColumns :
            subTab === 'approved' ? approvedColumns :
                declinedColumns;

    return (
        <div className="visitor-requests">
            <div className="visitor-subtabs">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`visitor-subtab-button ${subTab === t.key ? 'active' : ''}`}
                        onClick={() => setSubTab(t.key)}
                    >{t.label}</button>
                ))}
            </div>
            <div className="top-bar">
                <input
                    placeholder="Search by id, name, email..."
                    value={search}
                    onChange={e =>
                    {setSearch(e.target.value);
                        setCurrentPage(1); // Reset to first page on search}}
                    }}
                />
                <div className="date-filter">
                    <div className="date-picker-wrapper">
                        <FiCalendar className="calendar-icon" />
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            placeholderText="Filter by date"
                            dateFormat="yyyy-MM-dd"
                            className="styled-datepicker"
                            popperClassName="custom-datepicker-popper"
                        />
                    </div>

                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            style={{ marginLeft: '8px', padding: '6px 10px', fontSize: '0.8rem' }}
                            className="clear-date-btn"
                        >
                            Clear Date
                        </button>
                    )}
                </div>
                <button
                    className="export-btn"
                    onClick={() => exportRequestsPDF(subTab)}
                    disabled={data.length === 0}
                >
                    📄 Export {subTab.charAt(0).toUpperCase() + subTab.slice(1)} PDF
                </button>
            </div>

                <>
                    <DataTable
                        columns={columns}
                        data={data}
                        pagination
                        paginationServer
                        paginationPerPage={itemsPerPage}
                        paginationDefaultPage={currentPage}
                        highlightOnHover
                        pointerOnHover
                        striped
                        responsive
                        noDataComponent="No appointments found."
                    />


                </>
            <ToastContainer />
        </div>
    );
}