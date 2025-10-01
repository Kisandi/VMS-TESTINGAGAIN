import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

const UpcomingVisitors = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [visitors, setVisitors] = useState([]);
    const [filteredVisitors, setFilteredVisitors] = useState([]);

    useEffect(() => {
        const fetchUpcomingVisitors = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/v1/checkInOut/upcoming');
                const result = await response.json();
                if (result.success) {
                    const formatted = result.data.map((item, index) => {
                        const requestedDateTime = new Date(item.requested_date_time);

                        const requestedDate = requestedDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
                        const requestedTime = requestedDateTime.toTimeString().split(' ')[0]; // HH:MM:SS

                        return {
                            id: item.Visitor?.nic || `unknown-${index + 1}`,
                            fullName: `${item.Visitor?.first_name || ''} ${item.Visitor?.last_name || ''}`.trim(),
                            host: `${item.User?.first_name || ''} ${item.User?.last_name || ''}`.trim(),
                            purpose: item.purpose,
                            requestedDateTime: item.requested_date_time, // original datetime
                            requesteddate: requestedDate,               // ✅ new field
                            requestedtime: requestedTime,               // ✅ new field
                            duration: item.duration,
                        };
                    });

                    setVisitors(formatted);
                } else {
                    setVisitors([]);
                }
            } catch (error) {
                console.error('Error fetching upcoming visitors:', error);
            }
        };

        fetchUpcomingVisitors();
    }, []);


    useEffect(() => {
        const filtered = visitors.filter(visitor =>
            visitor.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVisitors(filtered);
    }, [searchTerm, visitors]);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text('Upcoming Visitors Report', 14, 16);
        autoTable(doc, {
            startY: 20,
            head: [['ID', 'Full Name', 'Purpose', 'Host', 'Requested Time', 'Duration', 'Requested Date']],
            body: filteredVisitors.map(v => [
                v.id,
                v.fullName,
                v.purpose,
                v.host,
                v.requestedtime,
                v.duration,
                v.requesteddate,
            ]),
        });
        doc.save('upcoming_visitors.pdf');
    };
    const columns = [
        { name: 'ID', selector: row => row.id, sortable: true },
        { name: 'Full Name', selector: row => row.fullName, sortable: true },
        { name: 'Purpose', selector: row => row.purpose },
        { name: 'Host', selector: row => row.host },
        { name: 'Requested Time', selector: row => row.requestedtime },
        { name: 'Duration', selector: row => row.duration },
        { name: 'Requested Date', selector: row => row.requesteddate }
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
                noDataComponent="No upcoming visitors found."
            />
        </div>
    );
};

export default UpcomingVisitors;
