import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

const PastVisitors = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [visitors, setVisitors] = useState([]);
    const [filteredVisitors, setFilteredVisitors] = useState([]);

    useEffect(() => {
        const fetchVisitors = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/v1/visitors/past');
                const result = await response.json();

                if (result.success) {
                    const formatted = result.data.map((item, index) => ({
                        id: item.id,
                        fullName: item.Visitor?.full_name,
                        purpose: item.purpose,
                        host: item.host?.full_name,
                        checkin: item.checkin_time,
                        checkout: item.checkout_time,
                        date: item.checkin_time?.split('T')[0], // extract date portion
                        blacklist: item.blacklist || false,
                    }));
                    setVisitors(formatted);
                } else {
                    setVisitors([]);
                }
            } catch (error) {
                console.error('Error fetching past visitors:', error);
            }
        };

        fetchVisitors();
    }, []);

    useEffect(() => {
        const filtered = visitors.filter(visitor =>
            visitor.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVisitors(filtered);
    }, [searchTerm, visitors]);

    const handleBlacklistToggle = (id) => {
        setVisitors(prev =>
            prev.map(visitor =>
                visitor.id === id ? { ...visitor, blacklist: !visitor.blacklist } : visitor
            )
        );
    };




    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text('Past Visitors Report', 14, 16);
        autoTable(doc, {
            startY: 20,
            head: [['ID', 'Full Name', 'Purpose', 'Host', 'Checkin Time', 'Checkout Time', 'Date' ,'Blacklist']],
            body: filteredVisitors.map(v => [
                v.id,
                v.fullName,
                v.purpose,
                v.host,
                v.checkin,
                v.checkout,
                v.date,
                v.blacklist,
            ]),
        });
        doc.save('past_visitors.pdf');
    };

    const columns = [
        { name: 'ID', selector: row => row.id, sortable: true },
        { name: 'Full Name', selector: row => row.fullName, sortable: true },
        { name: 'Purpose', selector: row => row.purpose },
        { name: 'Host', selector: row => row.host },
        { name: 'Checkin', selector: row => row.checkin },
        { name: 'Checkout', selector: row => row.checkout },
        { name: 'Date', selector: row => row.date },
        {
            name: 'Blacklist',
            cell: row => (
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={row.blacklist}
                        onChange={() => handleBlacklistToggle(row.id)}
                    />
                    <span className="slider round"></span>
                </label>
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
                persistTableHead
                noDataComponent="No past visitors found."
            />
        </div>
    );
};

export default PastVisitors;
