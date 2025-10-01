import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

const CurrentVisitors = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [visitors, setVisitors] = useState([]);
    const [filteredVisitors, setFilteredVisitors] = useState([]);

    useEffect(() => {
        const fetchVisitors = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/v1/checkInOut/current');
                const result = await response.json();

                if (result.success) {
                    const processed = result.data.map((v, index) => ({
                        id: v?.Visitor?.nic || `N/A-${index + 1}`,
                        fullName: `${v?.Visitor?.first_name || ''} ${v?.Visitor?.last_name || ''}`.trim(),
                        purpose: v?.rfid_token?.Appointment?.purpose || 'N/A',
                        host: `${v?.rfid_token?.Appointment?.User?.first_name || ''} ${v?.rfid_token?.Appointment?.User?.last_name || ''}`.trim(),
                        checkInTime: new Date(v?.checkin_time).toLocaleString(),
                        location: 'Main Gate', // Replace if location is dynamic in your DB
                        status: new Date() > new Date(v?.RFIDToken?.expired_at) ? 'Overstayed' : 'In Progress',
                    }));
                    setVisitors(processed);
                } else {
                    setVisitors([]);
                }
            } catch (error) {
                console.error('Error fetching current visitors:', error);
            }
        };

        fetchVisitors();
    }, []);

    useEffect(() => {
        const filtered = visitors.filter(v =>
            v.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVisitors(filtered);
    }, [searchTerm, visitors]);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text('Current Visitors Report', 14, 16);
        autoTable(doc, {
            startY: 20,
            head: [['ID', 'Full Name', 'Purpose', 'Host', 'Check-In Time', 'Location', 'Status']],
            body: filteredVisitors.map(v => [
                v.id,
                v.fullName,
                v.purpose,
                v.host,
                v.checkInTime,
                v.location,
                v.status,
            ]),
        });
        doc.save('current_visitors.pdf');
    };

    const columns = [
        { name: 'ID', selector: row => row.id, sortable: true },
        { name: 'Full Name', selector: row => row.fullName, sortable: true },
        { name: 'Purpose', selector: row => row.purpose },
        { name: 'Host', selector: row => row.host },
        { name: 'Check-In Time', selector: row => row.checkInTime },
        { name: 'Location', selector: row => row.location },
        {
            name: 'Status',
            selector: row => row.status,
            cell: row => (
                <span className={row.status === 'Overstayed' ? 'status-overstayed' : 'status-inprogress'}>
                    {row.status}
                </span>
            )
        }
    ];

    return (
        <div className="tab-content">
            <div className="top-bar">
                <input
                    type="text"
                    placeholder="Search by name..."
                    className="visitor-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="export-btn" onClick={exportPDF}>
                    📄 Export PDF
                </button>
            </div>

            <DataTable
                columns={columns}
                data={filteredVisitors}
                pagination
                highlightOnHover
                striped
                noDataComponent="No visitors found."
            />
        </div>
    );
};

export default CurrentVisitors;
