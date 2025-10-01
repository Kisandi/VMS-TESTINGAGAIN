const { PermissionHasUser, User, Location } = require('../models');

const getPermissionHasUser = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const data = await PermissionHasUser.findAndCountAll({
            offset,
            limit,
            order: [['permission_id', 'ASC']],
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: ['user_id', 'first_name', 'last_name', 'username'],
                },
                {
                    model: Location,
                    as: 'Location',
                    attributes: ['location_id', 'location'],
                }
            ]
        });
        //
        // if (data.count === 0) {
        //     return res.status(200).json({
        //         success: true,
        //         permissions: [],
        //         currentPage: page,
        //         totalPages: 0,
        //         totalRecords: 0,
        //     });
        // }

        return res.status(200).json({
            success: true,
            permissions: data.rows,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit),
            totalRecords: data.count,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching permissions',
            error: err.message,
        });
    }
};

const createPermissionHasUser = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const {  user_id, location_id } = req.body;

        if (!user_id || !location_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: permission_id, user_id, department_id, user_type_id',
            });
        }

        const data = await PermissionHasUser.create({

            user_id,
            location_id,
        });

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Failed to create permission mapping',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Permission mapping created successfully',
            data,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Error creating permission mapping',
            error: err.message,
        });
    }
};

const deletePermissionHasUser = async (req, res) => {
    try {
        const { permission_id, user_id } = req.params;

        if (!permission_id || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'permission_id and user_id are required to delete mapping',
            });
        }

        const deleted = await PermissionHasUser.destroy({
            where: { permission_id, user_id },
        });

        if (deleted === 0) {
            return res.status(404).json({
                success: false,
                message: 'No such permission-user mapping found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Permission-user mapping deleted successfully',
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Error deleting permission-user mapping',
            error: err.message,
        });
    }
};

module.exports = { getPermissionHasUser, createPermissionHasUser, deletePermissionHasUser };
