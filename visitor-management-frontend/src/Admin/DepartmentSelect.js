import React from "react";
import Select from "react-select";

const customStyles = {
    control: (provided) => ({
        ...provided,
        minHeight: '30px',   // reduce height
        width: '230px',      // set desired width or use a smaller one
        fontSize: '14px',    // smaller font size if you want
    }),
    valueContainer: (provided) => ({
        ...provided,
        padding: '0 6px',
    }),
    input: (provided) => ({
        ...provided,
        margin: '0px',
        padding: '0px',
    }),
    indicatorsContainer: (provided) => ({
        ...provided,
        height: '30px',
    }),
};


const DepartmentSelect = ({
                              departments = [],
                              selectedDepartments = [],
                              setSelectedDepartments,
                              error = null,
                          }) => {
    const departmentOptions = departments.map((dep) => ({
        value: dep.department_id,
        label: dep.department_name,
    }));

    const handleChange = (selected) => {
        setSelectedDepartments(selected.map((s) => s.value));
    };

    return (
        <div className="form-group">
            <label style={{ display: 'block', marginBottom: '22px' }}>
                Departments <span className="required">*</span>
            </label>

            <Select
                options={departmentOptions}
                isMulti
                value={departmentOptions.filter((opt) =>
                    selectedDepartments.includes(opt.value)
                )}
                onChange={handleChange}
                placeholder="Select departments..."
                styles={customStyles}
            />

            {error && <div className="error-msg">{error}</div>}
        </div>
    );
};

export default DepartmentSelect;
