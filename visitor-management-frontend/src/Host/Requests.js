import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiCalendar } from 'react-icons/fi';
import './HostDashboard.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Select from 'react-select';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Requests() {
    const [subTab, setSubTab] = useState('pending');
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;
    const userId = JSON.parse(localStorage.getItem('user'))?.user_id;
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineComment, setDeclineComment] = useState('');


    const exportRequestsPDF = (status) => {
        const doc = new jsPDF();

        const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

        const columns = [
            { header: 'ID', dataKey: 'nic' },
            { header: 'Full Name', dataKey: 'full_name' },
            { header: 'Purpose', dataKey: 'purpose' },
            { header: 'Requested Date', dataKey: 'date' },
            { header: 'Requested Time', dataKey: 'time' },
            ...(status === 'pending' ? [{ header: 'Meeting Location', dataKey: 'location' }] : []),
            ...(status === 'pending' ? [{ header: 'Duration', dataKey: 'duration' }] : []),
            ...(status === 'declined' ? [{ header: 'Comment', dataKey: 'comment' }] : []),
        ];

        const filteredData = data.filter(item => item.approval_status === status);

        const rows = filteredData.map(item => ({
            nic: item.nic,
            full_name: item.full_name,
            purpose: item.purpose,
            date: item.date,
            time: item.time,
            location: item.location,
            duration: item.duration || '',
            comment: item.comment || '',
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
    };



    const fetchAppointments = async (page = 1, searchTerm = '', date = null) => {
        setLoading(true);
        const params = new URLSearchParams({
            approval_status: subTab,
            user_id: userId,
            page,
            limit: itemsPerPage,
            search: searchTerm,
        });

        if (date) {
            params.append('date', dayjs(date).format('YYYY-MM-DD'));
        }

        try {
            const res = await fetch(`http://localhost:8080/api/v1/appointment/status?${params.toString()}`);

            const result = await res.json();
            if (result.success) {
                setData(result.data || []);
                setTotalRows(result.totalRecords || 0);
            } else {
                setData([]);
                setTotalRows(0);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setData([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    // Debounce effect for search, selectedDate, and subTab changes
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setCurrentPage(1);
            fetchAppointments(1, search, selectedDate);
        }, 500); // 500ms debounce delay

        return () => clearTimeout(delayDebounce); // cleanup previous timer
    }, [search, selectedDate, subTab]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchAppointments(page, search, selectedDate);
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };


    const handleStatusChange = async (appointmentId, newStatus) => {
      //  if (newStatus === 'approved' && !window.confirm("Approve this appointment?")) return;

        const appointmentToUpdate = data.find(item => item.appointment_id === appointmentId);
        if (!appointmentToUpdate) return;
        if (newStatus === 'approved') {
            setCurrentAppointmentId(appointmentId);
            setSelectedLocation(null);  // reset previous selection
            setShowLocationModal(true);  // open modal with location dropdown
            return;
        }
        if (newStatus === 'declined') {

            setCurrentAppointmentId(appointmentId);
            setDeclineComment('');
            setShowDeclineModal(true);
            return;
        }
        try {
            const res = await fetch(`http://localhost:8080/api/v1/appointment/${appointmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...appointmentToUpdate,
                    approval_status: newStatus,
                    duration: appointmentToUpdate.duration?.toString()
                })
            });

            const result = await res.json();
            if (result.success) {
                toast.success(`Appointment ${newStatus === 'approved' ? 'approved' : 'declined'} successfully`);
                fetchAppointments(currentPage, search, selectedDate);
            } else {
                toast.error(result.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Status update error:", error);
            toast.error("Server error");
        }
    };

    const columns = [
        { name: 'ID', selector: row =>  row.nic , sortable: true },
        { name: 'Full Name', selector: row => row.full_name, sortable: true },
        { name: 'Purpose', selector: row => row.purpose },
        { name: ' Requested Date', selector: row => row.date },
        { name: 'Requested Time', selector: row => row.time },

        ...(subTab === 'pending' ? [
            { name: 'Duration', selector: row => row.duration },
            {
                name: 'Action',
                cell: row => (
                    <select
                        value={row.approval_status}
                        onChange={(e) => handleStatusChange(row.appointment_id, e.target.value)}
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approve</option>
                        <option value="declined">Decline</option>
                    </select>
                ),
                ignoreRowClick: true,
                allowOverflow: true,
                button: true
            }
        ] : []),

        ...(subTab === 'approved' ? [
            { name: 'Meeting Location', selector: row => row.location || '-', wrap: true },
        ] : []),

        ...(subTab === 'declined' ? [
            { name: 'Comment', selector: row => row.comment || '-', wrap: true }
        ] : [])
    ];

    const tabs = [
        { key: 'pending', label: 'Pending Requests' },
        { key: 'approved', label: 'Approved Requests' },
        { key: 'declined', label: 'Declined Requests' }
    ];

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/v1/location/available?user_id=${userId}`);
                const json = await res.json();
                if (json.success) {
                    console.log(locations)
                    const options = json.locations.map(loc => ({
                        value: loc.location_id,
                        label: loc.location,
                    }));
                    setLocations(options);
                }
            } catch (error) {
                console.error('Failed to fetch locations', error);
            }
        };
        fetchLocations();
    }, []);




    return (
        <div className="requests-container">

            <div className="visitor-requests">
                <div className="visitor-subtabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`visitor-subtab-button ${subTab === tab.key ? 'active' : ''}`}
                            onClick={() => setSubTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="top-bar">
                    <input
                        placeholder="Search by ID or Name..."
                        value={search}
                        onChange={handleSearch}
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


                    <div >
                        <button
                            className="export-btn"
                            onClick={() => exportRequestsPDF(subTab)}
                            disabled={data.length === 0}
                        >
                            📄 Export {subTab.charAt(0).toUpperCase() + subTab.slice(1)} PDF
                        </button>
                    </div>



                </div>

                <DataTable
                    columns={columns}
                    data={data}
                    progressPending={loading}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={itemsPerPage}
                    onChangePage={handlePageChange}
                    highlightOnHover
                    striped
                    noDataComponent="No appointments found."
                    expandableRows={false}
                />

                {showLocationModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button
                                className="modal-close-btn"
                                onClick={() => {
                                    setShowLocationModal(false);
                                    setData(prevData =>
                                        prevData.map(item =>
                                            item.appointment_id === currentAppointmentId
                                                ? { ...item, approval_status: 'pending' }
                                                : item
                                        )
                                    );
                                    setSelectedLocation(null);
                                    setCurrentAppointmentId(null);
                                }}
                            >
                                ✖
                            </button>

                            <h3>Select Location for the Meeting</h3>
                            <Select
                                options={locations}
                                value={selectedLocation}
                                onChange={setSelectedLocation}
                                placeholder="Select a location"
                                isClearable
                            />
                            <div className="form-actions">
                                <button
                                    className="submit-btn"
                                    onClick={async () => {
                                        if (!selectedLocation) {
                                            toast.error("Please select a location");
                                            return;
                                        }
                                        const appointmentToUpdate = data.find(item => item.appointment_id === currentAppointmentId);
                                        try {
                                            const res = await fetch(`http://localhost:8080/api/v1/appointment/${currentAppointmentId}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    ...appointmentToUpdate,
                                                    approval_status: 'approved',
                                                    location_id: selectedLocation.value,
                                                    duration: appointmentToUpdate.duration?.toString(),
                                                }),
                                            });
                                            const result = await res.json();
                                            if (result.success) {
                                                toast.success("Appointment approved with location");
                                                fetchAppointments(currentPage, search, selectedDate);
                                            } else {
                                                toast.error(result.message || "Failed to approve appointment");
                                            }
                                        } catch (error) {
                                            toast.error("Server error");
                                        }
                                        setShowLocationModal(false);
                                        setSelectedLocation(null);
                                        setCurrentAppointmentId(null);
                                    }}
                                    style={{ marginRight: 10 }}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showDeclineModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button
                                className="modal-close-btn"
                                onClick={() => {
                                    setShowDeclineModal(false);
                                    setData(prevData =>
                                        prevData.map(item =>
                                            item.appointment_id === currentAppointmentId
                                                ? { ...item, approval_status: 'pending' }
                                                : item
                                        )
                                    );
                                    setDeclineComment('');
                                    setCurrentAppointmentId(null);
                                }}

                            >
                                ✖
                            </button>

                            <h3>Decline Appointment</h3>
                            <textarea
                                value={declineComment}
                                onChange={(e) => setDeclineComment(e.target.value)}
                                placeholder="Enter reason for declining"
                                rows="4"
                                style={{ width: '100%', marginTop: '10px' }}
                            />

                            <div className="form-actions">
                                <button
                                    className="submit-btn"
                                    onClick={async () => {
                                        if (!declineComment.trim()) {
                                            toast.error("Please enter a reason");
                                            return;
                                        }
                                        const appointmentToUpdate = data.find(item => item.appointment_id === currentAppointmentId);
                                        try {
                                            const res = await fetch(`http://localhost:8080/api/v1/appointment/${currentAppointmentId}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    ...appointmentToUpdate,
                                                    approval_status: 'declined',
                                                    comment: declineComment,
                                                    duration: appointmentToUpdate.duration?.toString(),
                                                }),
                                            });
                                            const result = await res.json();
                                            if (result.success) {
                                                toast.success("Appointment declined with reason");
                                                fetchAppointments(currentPage, search, selectedDate);
                                            } else {
                                                toast.error(result.message || "Failed to decline appointment");
                                            }
                                        } catch (error) {
                                            toast.error("Server error");
                                        }
                                        setShowDeclineModal(false);
                                        setDeclineComment('');
                                        setCurrentAppointmentId(null);
                                    }}
                                    style={{ marginRight: 10 }}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                <ToastContainer />
            </div>
        </div>
    );
}
