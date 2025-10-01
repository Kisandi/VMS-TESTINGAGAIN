const { UserType } = require('../models');

// GET all user types (with pagination)
const getUserTypes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await UserType.findAndCountAll({
            offset,
            limit,
            order: [['user_type_id', 'ASC']],
        });

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'No user types found' });
        }

        return res.status(200).json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(result.count / limit),
            totalRecords: result.count,
            userTypes: result.rows,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching user types', err });
    }
};

// GET user type by ID
const getUserTypeById = async (req, res) => {
    try {
        const { user_type_id } = req.params;

        if (!user_type_id) {
            return res.status(400).json({ success: false, message: 'User type ID is required' });
        }

        const userType = await UserType.findByPk(user_type_id);

        if (!userType) {
            return res.status(404).json({ success: false, message: 'User type not found' });
        }

        return res.status(200).json({ success: true, userType });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching user type', err });
    }
};

// CREATE user type
const createUserType = async (req, res) => {
    try {
        const { user_type_id, user_type } = req.body;

        if (!user_type_id || !user_type) {
            return res.status(400).json({ success: false, message: 'Both user_type_id and user_type are required' });
        }

        const newUserType = await UserType.create({ user_type_id, user_type });

        return res.status(201).json({ success: true, message: 'User type created successfully', userType: newUserType });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error creating user type', err });
    }
};

// UPDATE user type
const updateUserType = async (req, res) => {
    try {
        const { user_type_id } = req.params;
        const { user_type } = req.body;

        if (!user_type_id) {
            return res.status(400).json({ success: false, message: 'User type ID is required' });
        }

        const [updated] = await UserType.update(
            { user_type },
            { where: { user_type_id } }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'User type not found or not updated' });
        }

        return res.status(200).json({ success: true, message: 'User type updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error updating user type', err });
    }
};

// DELETE user type
const deleteUserType = async (req, res) => {
    try {
        const { user_type_id } = req.params;

        if (!user_type_id) {
            return res.status(400).json({ success: false, message: 'User type ID is required' });
        }

        const deleted = await UserType.destroy({ where: { user_type_id } });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'User type not found or already deleted' });
        }

        return res.status(200).json({ success: true, message: 'User type deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error deleting user type', err });
    }
};

module.exports = {
    getUserTypes,
    getUserTypeById,
    createUserType,
    updateUserType,
    deleteUserType,
};
