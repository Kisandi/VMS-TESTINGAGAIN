import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

const BlacklistVisitors = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [visitors, setVisitors] = useState([]);
    const [filteredVisitors, setFilteredVisitors] = useState([]);

    useEffect(() => {
        const fetchBlacklisted = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/v1/visitor/blacklisted');
                const result = await response.json();

                if (result.success) {
                    const formatted = result.visitors.map((item) => ({
                        id: item.visitor_id,
                        fullName: `${item.first_name} ${item.last_name}`,
                        nic: item.nic,
                        email: item.email,
                        contact: item.contact_number,
                        blacklist: item.blacklist_status === 'yes',
                    }));
                    setVisitors(formatted);
                    setFilteredVisitors(formatted);
                } else {
                    setVisitors([]);
                    setFilteredVisitors([]);
                }
            } catch (error) {
                console.error('Error fetching blacklisted visitors:', error);
            }
        };

        fetchBlacklisted();
    }, []);

    useEffect(() => {
        const filtered = visitors.filter(visitor =>
            visitor.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVisitors(filtered);
    }, [searchTerm, visitors]);

    const handleBlacklistToggle = async (id, currentStatus) => {
        const newStatus = currentStatus ? 'no' : 'yes'; // if currently yes (true), set no

        const updatedList = visitors.map(visitor =>
            visitor.id === id ? { ...visitor, blacklist: newStatus === 'yes' } : visitor
        );

        setVisitors(updatedList);
        setFilteredVisitors(updatedList.filter(visitor =>
            visitor.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        ));

        try {
            await fetch(`http://localhost:8080/api/v1/visitor/${id}/blacklist`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blacklist_status: newStatus }),
            });
        } catch (err) {
            console.error('Failed to update blacklist status', err);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text('Blacklisted Visitors Report', 14, 16);
        autoTable(doc, {
            startY: 20,
            head: [['ID', 'Full Name', 'NIC', 'Email', 'Contact', 'Blacklisted']],
            body: filteredVisitors.map(v => [
                v.id,
                v.fullName,
                v.nic,
                v.email,
                v.contact,
                v.blacklist ? 'Yes' : 'No',
            ]),
        });
        doc.save('blacklisted_visitors.pdf');
    };

    const columns = [
        { name: 'ID', selector: row => row.id, sortable: true },
        { name: 'Full Name', selector: row => row.fullName, sortable: true },
        { name: 'NIC', selector: row => row.nic },
        { name: 'Email', selector: row => row.email },
        { name: 'Contact', selector: row => row.contact },
        {
            name: 'Blacklist',
            cell: row => (
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={row.blacklist}
                        onChange={() => handleBlacklistToggle(row.id, row.blacklist)}
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
                noDataComponent="No blacklisted visitors found."
            />
        </div>
    );
};

export default BlacklistVisitors;