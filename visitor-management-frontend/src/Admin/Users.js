import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';
import { confirmDelete } from '../Confirm';
import './AdminDashboard.css';
import 'react-confirm-alert/src/react-confirm-alert.css';
import '../ConfirmStyles.css';
import AddForm from './AddForm';
import EditForm from './EditForm';

const itemsPerPage = 10;

const Users = () => {
    const [hostData, setHostData] = useState([]);
    const [hostSearch, setHostSearch] = useState('');
    const [hostPage, setHostPage] = useState(1);
    const [totalHostRows, setTotalHostRows] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);



    // Fetch host data from backend
    const fetchHosts = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/user?page=${hostPage}&limit=${itemsPerPage}&search=${hostSearch}`
            );
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();

            const mappedHosts = data.users.map(h => ({
                id: h.user_id,
                name: `${h.first_name} ${h.last_name}`,
                position: h.position,
                phone: h.contact,
                email: h.email,
                department: h.departments.join(', ') || 'N/A',// Comes from backend as joined Department name
            }));

            setHostData(mappedHosts);
            setTotalHostRows(data.totalItems || 0);
        } catch (err) {
            console.error('Failed to fetch hosts:', err);
            toast.error('Error loading hosts');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search to reduce API hits
    const debouncedFetch = debounce(() => {
        setHostPage(1);
        fetchHosts();
    }, 500);

    useEffect(() => {
        debouncedFetch();
        return debouncedFetch.cancel;
    }, [hostSearch]);

    useEffect(() => {
        if (!isAddModalOpen && !isEditModalOpen) {
            fetchHosts();
        }
    }, [hostPage, isAddModalOpen, isEditModalOpen]);


    const handleDeleteHost = async (hostId) => {
        const confirmed = await confirmDelete('Are you sure you want to delete this host?');
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:8080/api/v1/user/${hostId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete host');

            toast.success('Host deleted successfully!');
            fetchHosts();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete host');
        }
    };

    const handleAddHost = async ({ first_name, last_name, username, password, phone, email, position, department_ids,   user_type_ids }) => {


        try {
            const res = await fetch('http://localhost:8080/api/v1/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name,
                    last_name,
                    username,
                    password,
                    contact: phone,
                    email,
                    position,
                    department_ids,
                    user_type_ids
                }),
            });

            if (!res.ok) throw new Error('Failed to add host');

            toast.success('Host added successfully!');
            setIsAddModalOpen(false);
            fetchHosts(); // Refresh the table
        } catch (err) {
            console.error('Add host failed:', err);
            toast.error('Failed to add host');
        }
    };





    // Edit Modal Handlers
    const openEditModal = async (user) => {
        try {
            console.log('Fetching user details for:', user.id);
            const res = await fetch(`http://localhost:8080/api/v1/user/${user.id}`);
            if (!res.ok) throw new Error('Failed to fetch user details');
            const data = await res.json();
            console.log('User data fetched:', data);
            // Include user_type_ids from backend response
            setEditingUser({
                id: data.data.user_id,
                first_name: data.data.first_name,
                last_name: data.data.last_name,
                username: data.data.username,
                phone: data.data.contact,
                email: data.data.email,
                position: data.data.position,
                department_ids: data.data.Departments?.map(d => d.department_id) || [],
                user_type_ids: data.data.userRoles?.map(r => r.user_type_id) || [],
                user_type_names: (data.data.userRoles || []).map(r => r.userType?.user_type || '')
            })

            setIsEditModalOpen(true);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load user details');
        }
    };


    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveEdit = async (payload) => {
        if (!editingUser) return;

        try {
            // const bodyData = { first_name, last_name, useername, contact: phone, email, position, department_ids, user_type_ids };
            // if (password) {
            //     bodyData.password = password;
            // }
            const res = await fetch(`http://localhost:8080/api/v1/user/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to update host');

            toast.success('Host updated successfully!');
            fetchHosts();
            closeEditModal();
        } catch (err) {
            console.error('Update failed:', err);
            toast.error('Failed to update host');
        }
    };






    const downloadHostsPDF = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/user/exportAllHosts');
            if (!response.ok) throw new Error('Failed to fetch PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'hosts.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        }
    };

    const columns = [
        { name: 'ID', selector: row => row.id, sortable: true },
        { name: 'Name', selector: row => row.name, sortable: true },
        { name: 'Position', selector: row => row.position, sortable: true },
        { name: 'Phone', selector: row => row.phone },
        { name: 'Email', selector: row => row.email },
        {
            name: 'Department',
            cell: row => (
                <div>
                    {row.department.split(',').map((dep, idx) => (
                        <div key={idx}>{dep.trim()}</div>
                    ))}
                </div>
            )
        },
        {
            name: 'Actions',
            cell: row => (
                <>
                    <Edit
                        size={16}
                        style={{ cursor: 'pointer', marginRight: '8px' }}
                        onClick={() => {
                            console.log('Opening edit modal for user:', row);
                            openEditModal(row);
                        }}

                    />
                    <Trash2
                        size={16}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleDeleteHost(row.id)}
                    />
                </>
            )
        }
    ];

    return (
        <div className="tab-content">
            <div className="top-bar">
                <input
                    placeholder="Search by name, ID, email, phone, position or department"
                    value={hostSearch}
                    onChange={(e) => setHostSearch(e.target.value)}
                />
                <button className="export-btn" onClick={downloadHostsPDF}>📄 Export PDF</button>
                <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>➕ Add Host</button>

            </div>

            <DataTable
                columns={columns}
                data={hostData}
                progressPending={loading}
                pagination
                paginationServer
                paginationTotalRows={totalHostRows}
                paginationPerPage={itemsPerPage}
                paginationDefaultPage={hostPage}
                onChangePage={page => setHostPage(page)}
                highlightOnHover
                responsive
                persistTableHead
            />

            {/* Edit Modal */}
            {isEditModalOpen && editingUser && (
                <div className="modal-overlay">
                    <EditForm
                        user={editingUser}
                        onClose={closeEditModal}
                        onSave={handleSaveEdit}
                    />
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay" key="add-modal">
                    <AddForm
                        onClose={() => setIsAddModalOpen(false)}
                        onSave={handleAddHost}
                    />
                </div>
            )}


        </div>
    );
};

export default Users;
