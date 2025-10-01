import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';
import { confirmDelete } from '../Confirm';
import './AdminDashboard.css';

const itemsPerPage = 10;

const DepartmentTab = () => {
    const [deptData, setDeptData] = useState([]);
    const [deptSearch, setDeptSearch] = useState('');
    const [deptPage, setDeptPage] = useState(1);
    const [totalDeptRows, setTotalDeptRows] = useState(0);
    const [loading, setLoading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch departments
    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/department?page=${deptPage}&limit=${itemsPerPage}&search=${deptSearch}`
            );
            const data = await res.json();
            setDeptData(data.departments.map(d => ({ id: d.department_id, name: d.department_name })));
            setTotalDeptRows(data.totalItems || 0);
        } catch (err) {
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    const debouncedSearch = debounce(() => {
        setDeptPage(1);
        fetchDepartments();
    }, 500);

    useEffect(() => {
        debouncedSearch();
        return debouncedSearch.cancel;
    }, [deptSearch]);

    useEffect(() => {
        fetchDepartments();
    }, [deptPage]);

    const handleDelete = async (id) => {
        const confirmed = await confirmDelete('Are you sure you want to delete this department?');
        if (!confirmed) return;
        try {
            await fetch(`http://localhost:8080/api/v1/department/${id}`, { method: 'DELETE' });
            toast.success('Department deleted successfully!');
            fetchDepartments();
        } catch (err) {
            toast.error('Failed to delete department');
        }
    };

    const handleSaveEdit = async ({ name }) => {
        if (!editingDept) return;
        try {
            const res = await fetch(`http://localhost:8080/api/v1/department/${editingDept.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department_name: name }),
            });
            if (!res.ok) throw new Error('Update failed');
            toast.success('Department updated!');
            fetchDepartments();
            setIsEditModalOpen(false);
            setEditingDept(null);
        } catch (err) {
            toast.error('Failed to update department');
        }
    };

    const handleAddDepartment = async ({ name }) => {
        try {
            const res = await fetch('http://localhost:8080/api/v1/department', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department_name: name }),
            });
            if (!res.ok) throw new Error('Failed to add department');

            toast.success('Department added successfully!');
            setDeptSearch('');
            setDeptPage(1);
            setIsAddModalOpen(false);
            fetchDepartments();
        } catch (err) {
            toast.error('Failed to add department');
        }
    };

    const downloadDepartmentsPDF = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/department/exportAllDepartments');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'departments.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to export PDF');
        }
    };

    const columns = [
        { name: 'ID', selector: row => row.id, sortable: true },
        { name: 'Department', selector: row => row.name, sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <>
                    <Edit
                        size={16}
                        style={{ cursor: 'pointer', marginRight: '8px' }}
                        onClick={() => {
                            setEditingDept(row);
                            setIsEditModalOpen(true);
                        }}
                    />
                    <Trash2
                        size={16}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleDelete(row.id)}
                    />
                </>
            )
        }
    ];

    const EditForm = ({ dept, onClose, onSave }) => {
        const [name, setName] = useState(dept.name || '');

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave({ name });
        };

        return (
            <form onSubmit={handleSubmit} className="add-form-modal">
                <button className="close-btn" type="button" onClick={onClose}>×</button>
                <h3>Edit Department</h3>
                <div className="form-group">
                    <label>Name <span className="required">*</span></label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-actions">
                    <button type="submit" className="submit-btn">Save</button>
                </div>
            </form>
        );
    };

    const AddForm = ({ onClose, onSave }) => {
        const [name, setName] = useState('');

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave({ name });
        };

        return (
            <form onSubmit={handleSubmit} className="add-form-modal">
                <button className="close-btn" type="button" onClick={onClose}>×</button>
                <h3>Add Department</h3>
                <div className="form-group">
                    <label>Name <span className="required">*</span></label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-actions">
                    <button type="submit" className="submit-btn">Add</button>
                </div>
            </form>
        );
    };

    return (
        <div className="tab-content">
            <div className="top-bar">
                <input
                    placeholder="Search Department"
                    value={deptSearch}
                    onChange={e => setDeptSearch(e.target.value)}
                />
                <button className="export-btn" onClick={downloadDepartmentsPDF}>📄 Export PDF</button>
                <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>➕ Add Department</button>
            </div>

            <DataTable
                columns={columns}
                data={deptData}
                progressPending={loading}
                pagination
                paginationServer
                paginationTotalRows={totalDeptRows}
                paginationPerPage={itemsPerPage}
                paginationDefaultPage={deptPage}
                onChangePage={setDeptPage}
                highlightOnHover
                pointerOnHover
                responsive
                persistTableHead
            />

            {isEditModalOpen && editingDept && (
                <div className="modal-overlay">
                    <EditForm
                        dept={editingDept}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setEditingDept(null);
                        }}
                        onSave={handleSaveEdit}
                    />
                </div>
            )}

            {isAddModalOpen && (
                <div className="modal-overlay">
                    <AddForm
                        onClose={() => setIsAddModalOpen(false)}
                        onSave={handleAddDepartment}
                    />
                </div>
            )}
        </div>
    );
};

export default DepartmentTab;
