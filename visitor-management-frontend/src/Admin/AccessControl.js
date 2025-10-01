import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { FaEdit, FaTrash } from 'react-icons/fa';
import "./AdminDashboard.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';

function AccessControl() {
  // --- Locations State ---
  const [locations, setLocations] = useState([]);
  const [locationForm, setLocationForm] = useState({ location: "", is_public: false });
  const [editingLocationId, setEditingLocationId] = useState(null);

  // --- Hosts and Permissions State ---
  const [hosts, setHosts] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionForm, setPermissionForm] = useState({ user_id: "", location_id: "" });

  // --- Fetch initial data ---
  useEffect(() => {
    fetchLocations();
    fetchHosts();
    fetchPermissions();
  }, []);

  // --- API calls ---

  // Locations
  async function fetchLocations() {
    const res = await fetch(`http://localhost:8080/api/v1/location`);
    const data = await res.json();
    setLocations(data.locations || []);
  }

  async function saveLocation(e) {
    e.preventDefault();
    const { location, is_public } = locationForm;

    if (!location.trim()) {
      toast.error("Location name required");
      return;
    }

    try {
      if (editingLocationId) {
        // Update existing
        await fetch(`http://localhost:8080/api/v1/location/${editingLocationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location, is_public }),
        });
        setEditingLocationId(null);
      } else {
        // Create new
        await fetch(`http://localhost:8080/api/v1/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location, is_public }),
        });
      }
      setLocationForm({ location: "", is_public: false });
      fetchLocations();
    } catch (error) {
      toast.error("Error saving location");
    }
  }

  async function editLocation(loc) {
    setEditingLocationId(loc.location_id);
    setLocationForm({ location: loc.location, is_public: !!loc.is_public });
  }

  async function deleteLocation(id) {
    if (!window.confirm("Delete this location?")) return;
    await fetch(`http://localhost:8080/api/v1/location/${id}`, { method: "DELETE" });
    fetchLocations();
  }

  // Hosts
  async function fetchHosts() {
    const res = await fetch(`http://localhost:8080/api/v1/user/hosts`);
    const data = await res.json();
    setHosts(data.hosts || []);
  }

  // Permissions
  async function fetchPermissions() {
    const res = await fetch(`http://localhost:8080/api/v1/permissionHasUser`);
    const data = await res.json();
    setPermissions(data.permissions || []);
  }

  async function assignPermission(e) {
    e.preventDefault();
    const { user_id, location_id } = permissionForm;

    if (!user_id || !location_id) {
      toast.error("Select host and location");
      return;
    }

    try {
      await fetch(`http://localhost:8080/api/v1/permissionHasUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, location_id }),
      });
      setPermissionForm({ user_id: "", location_id: "" });
      fetchPermissions();
    } catch (error) {
      toast.error("Error assigning permission");
    }
  }

  async function revokePermission(permission_id, user_id) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to revoke this permission?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, revoke it!'
    });

    if (!result.isConfirmed) return;

    await fetch(`http://localhost:8080/api/v1/permissionHasUser/${permission_id}/${user_id}`, {
      method: "DELETE",
    });

    fetchPermissions();
  }


  const locationColumns = [
    { name: "Location Name", selector: row => row.location, sortable: true },
    {
      name: "Public",
      cell: row => (row.is_public ? "✅" : "❌"),
      center: true,
      sortable: true
    },
    {
      name: "Actions",
      cell: row => (
          <>
            <button
                onClick={() => editLocation(row)}
                className="action-button edit-btn"
                title="Edit"
            >
              <FaEdit />
            </button>
            <button
                onClick={() => deleteLocation(row.location_id)}
                className="action-button delete-btn"
                title="Delete"
            >
              <FaTrash />
            </button>
          </>
      )
    }
  ];

  const permissionColumns = [
    {
      name: "Host",
      selector: row => `${row.User?.first_name || ""} ${row.User?.last_name || ""}`,
      sortable: true
    },
    {
      name: "Location",
      selector: row => row.Location?.location || "",
      sortable: true
    },
    {
      name: "Actions",
      cell: row => (
          <button onClick={() => revokePermission(row.permission_id,  row.user_id)}>Revoke</button>
      )
    }
  ];
  return (
      <div >
        <ToastContainer  />
        <h1>Admin Access Control</h1>

        {/* --- Manage Locations --- */}
        <section >
          <h2>Manage Locations</h2>
          <form onSubmit={saveLocation}  className="access-control-form">
            <input
                type="text"
                placeholder="Location Name"
                value={locationForm.location}
                onChange={(e) => setLocationForm({ ...locationForm, location: e.target.value })}

            />
            <label>
              <input
                  type="checkbox"
                  checked={locationForm.is_public}
                  onChange={(e) => setLocationForm({ ...locationForm, is_public: e.target.checked })}

              />{" "}
              Public
            </label>

              <button type="submit" className="submit-btn">
                {editingLocationId ? "Update" : "Add"}
              </button>
              {editingLocationId && (
                  <button
                      type="button"
                      className="submit-btn"
                      onClick={() => {
                        setEditingLocationId(null);
                        setLocationForm({ location: "", is_public: false });
                      }}
                  >
                    Cancel
                  </button>
              )}


          </form>

          <DataTable
              columns={locationColumns}
              data={locations}
              noDataComponent="No locations found."
              pagination
              highlightOnHover
          />
        </section>

        {/* --- Assign Permissions --- */}
        <section>
          <h2>Assign Permissions to Hosts</h2>
          <form onSubmit={assignPermission} className="access-control-form">
            <select
                value={permissionForm.user_id}
                onChange={(e) => setPermissionForm({ ...permissionForm, user_id: e.target.value })}

            >
              <option value="">Select Host</option>
              {hosts.map((host) => (
                  <option key={host.user_id} value={host.user_id}>
                    {host.first_name} {host.last_name} ({host.position})
                  </option>
              ))}
            </select>

            <select
                value={permissionForm.location_id}
                onChange={(e) => setPermissionForm({ ...permissionForm, location_id: e.target.value })}

            >
              <option value="">Select Location</option>
              {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location}
                  </option>
              ))}
            </select>

            <button type="submit" className="submit-btn">Assign</button>
          </form>

          <DataTable
              columns={permissionColumns}
              data={permissions}
              noDataComponent="No permissions assigned."
              pagination
              highlightOnHover
          />
        </section>
      </div>
  );
}

export default AccessControl;
