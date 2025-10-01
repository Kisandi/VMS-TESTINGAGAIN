const { Permission } = require('../models');

// GET paginated permissions
const getPermission = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const data = await Permission.findAndCountAll({
            offset,
            limit,
            order: [['permission_id', 'ASC']],
        });

        res.json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit),
            totalRecords: data.count,
            permissions: data.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error getting permissions',
            error: err.message
        });
    }
};

// GET permission by ID
const getPermissionById = async (req, res) => {
    try {
        const permissionId = req.params.permission_id;

        const data = await Permission.findOne({ where: { permission_id: permissionId } });
        if (!data) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error getting permission by ID', error: err.message });
    }
};

// CREATE permission
const createPermission = async (req, res) => {
    try {
        const { permission_id, permission_name, location_id } = req.body;

        if (!permission_id || !permission_name || !location_id) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const data = await Permission.create({ permission_id, permission_name, location_id });

        res.status(201).json({ success: true, message: 'Permission created', data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error creating permission', error: err.message });
    }
};

// UPDATE permission
const updatePermission = async (req, res) => {
    try {
        const permissionId = req.params.permission_id;
        const { permission_name, location_id } = req.body;

        const [updatedCount] = await Permission.update(
            { permission_name, location_id },
            { where: { permission_id: permissionId } }
        );

        if (updatedCount === 0) {
            return res.status(404).json({ success: false, message: 'Permission not found or no change' });
        }

        res.json({ success: true, message: 'Permission updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error updating permission', error: err.message });
    }
};

// DELETE permission
const deletePermission = async (req, res) => {
    try {
        const permissionId = req.params.permission_id;

        const deletedCount = await Permission.destroy({ where: { permission_id: permissionId } });

        if (deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }

        res.json({ success: true, message: 'Permission deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error deleting permission', error: err.message });
    }
};

module.exports = {
    getPermission,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission
};
