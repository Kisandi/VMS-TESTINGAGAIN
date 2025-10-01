const { UserDepartment } = require('../models');

const getAllUserDepartments = async (req, res) => {
    try {
        const data = await UserDepartment.findAll();

        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No user-department records found',
            });
        }

        res.status(200).json({
            success: true,
            userDepartments: data,
        });
    } catch (err) {
        console.error('Error fetching user-department records:', err);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user-department records',
            error: err.message,
        });
    }
};

module.exports = {
    getAllUserDepartments,
};
