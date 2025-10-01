import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import FormFeedback from "../FormFeedback";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { FaAsterisk } from 'react-icons/fa';
import DataTable from 'react-data-table-component';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

function Dashboard() {
  const [activeTab, setActiveTab] = useState('request');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [departments, setDepartments] = useState([]);
  const [users, setHosts] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedHost, setSelectedHost] = useState('');
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [filteredHosts, setFilteredHosts] = useState([]);
  const RequiredMark = () => <FaAsterisk color="red" size="0.3em" style={{ marginLeft: '1px', position: 'relative', top: '-0.3em' }} />;
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPastVisits, setTotalPastVisits] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all'); // default status

  const [userDepartments, setUserDepartments] = useState([]);
  // Form fields
  const [form, setForm] = useState({
    purpose: '',
    date: '',
    time: '',
    end_time: '',
  });

  const [errors, setErrors] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const visitRequests = appointments.filter(app =>
      ['pending', 'approved', 'rejected'].includes(app.approval_status?.toLowerCase())
  );
  const [pastVisits, setPastVisits] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [positions, setPositions] = useState([]);
  const visitorId = localStorage.getItem('visitor_id');

  useEffect(() => {
    setCurrentPage(1);
    setSearch('');
  }, [activeTab]);

  useEffect(() => {
    const fetchVisitorName = async () => {
      if (!visitorId) return;

      try {
        const res = await fetch(`http://localhost:8080/api/v1/visitor/${visitorId}`);
        const data = await res.json();

        console.log("Visitor API Response:", data); // Helpful for debugging

        if (res.ok && data.success) {
          if (data.visitor) {
            setVisitorName(`${data.visitor.first_name}`);

          } else {
            console.warn('API responded with success, but no visitor object was found.');
          }
        } else {
          console.warn('Failed to fetch visitor data:', data.message || 'Unknown error');
        }

      } catch (err) {
        console.error('Error fetching visitor info:', err);
      }
    };

    fetchVisitorName();
  }, [visitorId]);


  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const deptRes = await fetch('http://localhost:8080/api/v1/department?page=1&limit=100');
        const userPositionsRes = await fetch('http://localhost:8080/api/v1/user/user-positions/?user_type_id=UTI01');
        const userDeptRes = await fetch('http://localhost:8080/api/v1/user-department');

        const deptData = await deptRes.json();
        const userPositionsData = await userPositionsRes.json();
        const userDeptData = await userDeptRes.json();

        setDepartments(deptData.departments || []);

        // This contains full user info with position, so set to hosts/users state
        setHosts(userPositionsData.positions || []);

        setUserDepartments(userDeptData.userDepartments || []);

        // Optionally, extract unique positions from this data for dropdown:
        const uniquePositions = [...new Set((userPositionsData.positions || []).map(user => user.position))];
        setPositions(uniquePositions);

      } catch (err) {
        console.error("Failed to load dropdown data:", err);
      }
    };

    fetchDropdownData();
  }, []);




  useEffect(() => {
    if (activeTab === 'status') {
      const fetchAppointments = async () => {
        setLoadingAppointments(true);
        try {
          const res = await fetch(`http://localhost:8080/api/v1/appointment/status-by-visitor?visitor_id=${visitorId}&approval_status=${statusFilter}&search=${search}&page=${currentPage}&limit=${itemsPerPage}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setAppointments(data.data);
            setTotalRecords(data.totalRecords);
          } else {
            setAppointments([]);
            setTotalRecords(0);
          }
        } catch (err) {
          console.error("Error fetching appointments:", err);
          setAppointments([]);
          setTotalRecords(0);
        } finally {
          setLoadingAppointments(false);
        }
      };

      fetchAppointments();
    }

  }, [activeTab, visitorId, search, currentPage]);

  useEffect(() => {

    if(activeTab==='past'){
      const fetchPastVisits = async () => {
        setLoading(true);


        try {
          const response = await fetch(`http://localhost:8080/api/v1/checkInOut/past?visitor_id=${visitorId}&search=${search}&page=${currentPage}&limit=${itemsPerPage}`);

          const data = await response.json();
          const normalized = (Array.isArray(data.data) ? data.data : []).map(r => ({
            // what your table reads:
            user_id: r.Appointment?.user_id ?? r.user_id ?? r.appointment?.user_id ?? null,
            department_id: r.Appointment?.department_id ?? r.department_id ?? r.appointment?.department_id ?? null,
            requested_date_time: r.Appointment?.requested_date_time ?? r.requested_date_time ?? r.appointment?.requested_date_time ?? null,
            end_time: r.Appointment?.end_time ?? r.end_time ?? r.appointment?.end_time ?? null,
            duration: r.Appointment?.duration ?? r.duration ?? r.appointment?.duration ?? null,
            check_in_time: r.checkin_time ?? r.check_in_time ?? null,
            check_out_time: r.checkout_time ?? r.check_out_time ?? null,
            // keep originals if you still need them:
            Appointment: r.Appointment ?? r.appointment ?? null,
            department_id_fallback: r.department_id ?? null,
          }));

          setVisits(normalized);
          setTotalPastVisits(data.totalRecords ?? normalized.length);
        }
        catch (err) {
          setError('Failed to load past visits.');
          console.error(err);
          setVisits([]);
          setTotalPastVisits(0);
        } finally {
          setLoading(false);
        }
      };

      fetchPastVisits();}
  }, [activeTab, search, currentPage]);




  const handleDeptChange = (e) => {
    const deptId = e.target.value;
    setSelectedDept(deptId);
    setSelectedPosition('');
    setSelectedHost('');

    const userIdsInDept  = userDepartments
        .filter(ud => ud.department_id === deptId)
        .map(ud => ud.user_id);
    const usersInDept = users.filter(user => userIdsInDept.includes(user.user_id));
    const uniquePositions = [...new Set(usersInDept.map(user => user.position))];
    setFilteredPositions(uniquePositions);
    setFilteredHosts([]);
  };

  const handlePositionChange = (e) => {
    const pos = e.target.value;
    setSelectedPosition(pos);
    setSelectedHost('');
    const userIdsInDept = userDepartments
        .filter(ud => ud.department_id === selectedDept)
        .map(ud => ud.user_id);
    const hostsFiltered = users.filter(
        user => userIdsInDept.includes(user.user_id) && user.position === pos
    );
    setFilteredHosts(hostsFiltered);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.purpose) newErrors.purpose = 'Purpose is required.';
    if (!form.date) newErrors.date = 'Date is required.';
    if (!form.time) newErrors.time = 'Time is required.';
    if (!form.end_time) newErrors.endtime = 'Time is required.';
    if (!selectedDept) newErrors.department = 'Department is required.';
    if (!selectedPosition) newErrors.position = 'Position is required.';
    if (!selectedHost) newErrors.host = 'Host is required.';

    const start = dayjs(`${form.date}T${form.time}`);
    const end = dayjs(`${form.date}T${form.end_time}`);
    const now = dayjs();

    if (start <= now) {
      newErrors.dateTime = 'Appointment must be set for a future time.';
    }

    if (end <= start) {
      newErrors.duration = 'End time must be after start time.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const start = dayjs(`${form.date}T${form.time}`);
    const end = dayjs(`${form.date}T${form.end_time}`);

    const durationMinutes = end.diff(start, 'minute');

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const durationFormatted = `${hours}h ${minutes}m`;

    const formattedDateTime = start.format('YYYY-MM-DD HH:mm:ss');
    const createdAt = new Date().toISOString();

    const appointmentData = {
      appointment_id: `apt-${Date.now()}`,
      created_at: createdAt,
      requested_date_time: formattedDateTime,
      purpose: form.purpose,
      end_time: form.end_time,
      duration: durationFormatted,
      approval_status: 'pending',
      department_id: selectedDept,
      visitor_id: visitorId,
      token_id: null,
      user_id: selectedHost,
    };

    try {
      const res = await fetch('http://localhost:8080/api/v1/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (res.ok) {
        toast.success('Visit request submitted!');
        setForm({ purpose: '', date: '', time: '', end_time: '' });
        setSelectedDept('');
        setSelectedPosition('');
        setSelectedHost('');
        setErrors({});
      } else {
        toast.error('Submission failed.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };




  const filteredPast = pastVisits.filter(r => r.host.toLowerCase().includes(search.toLowerCase()));


  const paginatedPast = filteredPast.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  // Helper to find user by user_id and get full name and position
  const getUserById = (id) => users.find(user => user.user_id === id);

  const getHostName = (user_id) => {
    const user = getUserById(user_id);
    return user ? `${user.first_name} ${user.last_name}` : 'N/A';
  };

  const filteredRequests = visitRequests.filter(r => {
    const hostName = getHostName(r.user_id).toLowerCase();
    return hostName.includes(search.toLowerCase());
  });

  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(
      (activeTab === 'status' ? filteredRequests.length : filteredPast.length) / itemsPerPage
  );

  const getPosition = (user_id) => {
    const user = getUserById(user_id);
    return user ? user.position : 'N/A';
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.department_id === deptId);
    return dept ? dept.department_name : 'N/A';
  };


  return (
      <div className="dashboard">
        <header className="dashboard-header">
          <Link to="/" className="back-btn">←</Link>
          <span className="company-name">☁ Company Name</span>
        </header>

        <h2 className="welcome-text">Welcome, {visitorName || 'Visitor'}</h2>


        <nav className="tab-menu">
          <button className={activeTab === 'request' ? 'active' : ''} onClick={() => setActiveTab('request')}>Request a Visit</button>
          <button className={activeTab === 'status' ? 'active' : ''} onClick={() => setActiveTab('status')}>Request Status</button>
          <button className={activeTab === 'past' ? 'active' : ''} onClick={() => setActiveTab('past')}>Past Visits</button>
        </nav>

        <main className="tab-content">

          {activeTab === 'request' && (
              <form className="visit-form" onSubmit={handleRequestSubmit}>
                {/* Your existing request form code here */}
                <div className="form-column">
                  <label htmlFor="purpose">Purpose<RequiredMark /> </label>
                  <input id="purpose" type="text" value={form.purpose} onChange={handleInputChange} />
                  <FormFeedback message={errors.purpose} />
                </div>
                <div className="form-row">
                  <div className="form-column">
                    <label htmlFor="date">Date<RequiredMark /> </label>
                    <input
                        id="date"
                        type="date"
                        value={form.date}
                        min={dayjs().format('YYYY-MM-DD')}
                        onChange={handleInputChange}
                    />

                    <FormFeedback message={errors.date} />

                  </div>

                  <div className="form-column">
                    <label htmlFor="time">Start Time<RequiredMark /> </label>
                    <input id="time" type="time" value={form.time} onChange={handleInputChange} />
                    <FormFeedback message={errors.time} />

                  </div>

                  <div className="form-column">
                    <label htmlFor="end_time">End Time<RequiredMark /> </label>
                    <input id="end_time" type="time" value={form.end_time} onChange={handleInputChange} />
                    <FormFeedback message={errors.endtime} />

                  </div>
                </div>

                <FormFeedback message={errors.dateTime} />
                <FormFeedback message={errors.duration} />



                <div className="form-row">
                  <div className="form-column">
                    <label htmlFor="department">Department<RequiredMark /> </label>
                    <select id="department" value={selectedDept} onChange={handleDeptChange}>
                      <option value="" disabled>Select Department</option>
                      {departments.map(dept => (
                          <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                      ))}
                    </select>
                    <FormFeedback message={errors.department} />

                  </div>

                  <div className="form-column">
                    <label htmlFor="position">Position<RequiredMark /> </label>
                    <select id="position" value={selectedPosition} onChange={handlePositionChange} disabled={!selectedDept}>
                      <option value="">Select Position</option>
                      {filteredPositions.map((pos, i) => (
                          <option key={i} value={pos}>{pos}</option>
                      ))}
                    </select>
                    <FormFeedback message={errors.position} />

                  </div>

                  <div className="form-column">
                    <label htmlFor="host">Host Name<RequiredMark /> </label>
                    <select id="host" value={selectedHost} onChange={(e) => setSelectedHost(e.target.value)} disabled={!selectedPosition}>
                      <option value="">Select Host</option>
                      {filteredHosts.map(user => (
                          <option key={user.user_id} value={user.user_id}>
                            {user.first_name} {user.last_name}
                          </option>
                      ))}
                    </select>
                    <FormFeedback message={errors.host} />

                  </div>
                </div>
                <button type="submit" className="submit-btn">Submit Request</button>
              </form>
          )}

          {activeTab === 'status' && (
              <>
                <div className="search-bar">
                  <input
                      type="text"
                      placeholder="Search by Name, Purpose, Department, Position, Status"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1); // reset pagination on search
                      }}
                  />
                  <button onClick={() => window.print()}>Print</button>
                </div>

                <DataTable
                    columns={[
                      {
                        name: 'Host',
                        selector: row =>
                            // 1) try lookup list you already loaded
                            getHostName(row.user_id)
                            // 2) fallback: use nested Appointment.User if present
                            || `${row.Appointment?.User?.first_name ?? ''} ${row.Appointment?.User?.last_name ?? ''}`.trim()
                            || 'N/A',
                        sortable: true
                      },
                      {
                        name: 'Position',
                        selector: row => getPosition(row.user_id)
                      },
                      {
                        name: 'Department',
                        selector: row => row.department || getDepartmentName(row.department_id) || 'N/A'
                      },
                      {
                        name: 'Purpose',
                        selector: row => row.purpose
                      },
                      {
                        name: 'Date',
                        selector: row => dayjs(row.requested_date_time).format('YYYY-MM-DD')
                      },
                      {
                        name: 'Time',
                        selector: row => dayjs(row.requested_date_time).format('HH:mm')
                      },
                      {
                        name: 'End Time',
                        selector: row => dayjs(`1970-01-01T${row.end_time}`).format('HH:mm')
                      },
                      {
                        name: 'Status',
                        selector: row => row.approval_status || row.check_in_status
                      },
                      {
                        name: 'Comment',
                        selector: row => row.comment
                      }
                    ]}
                    data={appointments}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRecords}
                    paginationPerPage={itemsPerPage}
                    onChangePage={(page) => setCurrentPage(page)}
                    highlightOnHover
                    striped
                />
              </>
          )}


          {activeTab === 'past' && (
              <>
                <div className="search-bar">
                  <input
                      type="text"
                      placeholder="Search by ID, Name, Purpose, Department"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1); // reset to page 1 on search
                      }}
                  />
                  <button onClick={() => window.print()}>Print</button>
                </div>


                <DataTable
                    columns={[
                      {
                        name: 'Host',
                        selector: row => getHostName(row.user_id),
                        sortable: true
                      },
                      {
                        name: 'Department',
                        selector: row => getDepartmentName(row.department_id)
                      },
                      {
                        name: 'Purpose',
                        selector: row => row.Appointment?.purpose || 'N/A'
                      },
                      {
                        name: 'Date',
                        selector: row => dayjs(row.requested_date_time).format('YYYY-MM-DD')
                      },
                      {
                        name: 'Check-in',
                        selector: row => dayjs(row.check_in_time).format('HH:mm')
                      },
                      {
                        name: 'Check-out',
                        selector: row => dayjs(row.check_out_time).format('HH:mm')
                      },
                      {
                        name: 'Duration',
                        selector: row => row.duration
                      }
                    ]}
                    data={visits}
                    pagination
                    paginationServer
                    paginationTotalRows={totalPastVisits}
                    paginationPerPage={itemsPerPage}
                    onChangePage={(page) => setCurrentPage(page)}
                    highlightOnHover
                    striped

                />

              </>

          )}


        </main>

        <ToastContainer position="top-center" className='custom-toast' autoClose={1000} hideProgressBar={true} />
      </div>
  );

}

export default Dashboard;
