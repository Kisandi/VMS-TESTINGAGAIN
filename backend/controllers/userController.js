const { User, Department, UserRoles, UserType} = require('../models');
const bcrypt = require('bcrypt');
const PDFDocument = require("pdfkit");
const {Op} = require("sequelize");
const jwt = require('jsonwebtoken');

const exportAllHosts = async (req, res) => {
    try {
        const hosts = await User.findAll({
            include: [{
                model: Department,
                attributes: ['department_name'],
                through: { attributes: [] }
            }],
            order: [['user_id', 'ASC']],
        });

        if (!hosts || hosts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hosts found',
            });
        }

        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Disposition', 'attachment; filename=hosts.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Constants for layout
        const tableTop = 100;
        const rowHeight = 25;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
        const bottomMargin = 50;

        const columnWidths = [50, 140, 220, 110, 110, 130]; // sum ~760 (landscape A4 width ~842)
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Position', 'Department'];

        // Current vertical position tracker
        let y = tableTop;

        // Add Title
        doc.fontSize(20).text('All Hosts Report', { align: 'center' });
        y += 40;

        // Draw table header background
        doc.rect(doc.page.margins.left, y - rowHeight + 5, pageWidth, rowHeight).fill('#cccccc').fillColor('black');

        // Draw table headers text and vertical lines
        let x = doc.page.margins.left;
        doc.fontSize(12).font('Helvetica-Bold');
        for (let i = 0; i < headers.length; i++) {
            doc.text(headers[i], x + 5, y - rowHeight + 12, { width: columnWidths[i] - 10, align: 'left' });
            x += columnWidths[i];
        }

        // Draw horizontal line below header
        doc.moveTo(doc.page.margins.left, y + 5)
            .lineTo(doc.page.margins.left + pageWidth, y + 5)
            .stroke();

        y += 5;

        // Reset font for rows
        doc.font('Helvetica').fontSize(10);

        // Helper to draw borders for a row
        function drawRowBorders(yPos) {
            let xPos = doc.page.margins.left;
            // Horizontal lines
            doc.moveTo(xPos, yPos).lineTo(xPos + pageWidth, yPos).stroke();
            doc.moveTo(xPos, yPos + rowHeight).lineTo(xPos + pageWidth, yPos + rowHeight).stroke();
            // Vertical lines
            for (let i = 0; i <= columnWidths.length; i++) {
                let vx = doc.page.margins.left + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                doc.moveTo(vx, yPos).lineTo(vx, yPos + rowHeight).stroke();
            }
        }

        // Draw first header borders
        drawRowBorders(y - rowHeight + 5);

        // For each host, draw row and text
        for (let i = 0; i < hosts.length; i++) {
            const user = hosts[i];
            y += rowHeight;

            // Add new page if near bottom
            if (y + rowHeight + bottomMargin > doc.page.height - doc.page.margins.bottom) {
                doc.addPage({ size: 'A4', layout: 'landscape' });
                y = tableTop + rowHeight; // reset y to below header
                // redraw headers on new page
                // Draw header background
                doc.rect(doc.page.margins.left, y - rowHeight + 5, pageWidth, rowHeight).fill('#cccccc').fillColor('black');
                x = doc.page.margins.left;
                doc.font('Helvetica-Bold').fontSize(12);
                for (let j = 0; j < headers.length; j++) {
                    doc.text(headers[j], x + 5, y - rowHeight + 12, { width: columnWidths[j] - 10, align: 'left' });
                    x += columnWidths[j];
                }
                // Horizontal line below header
                doc.moveTo(doc.page.margins.left, y + 5)
                    .lineTo(doc.page.margins.left + pageWidth, y + 5)
                    .stroke();
                drawRowBorders(y - rowHeight + 5);
                doc.font('Helvetica').fontSize(10);
                y += 5;
            }

            const departmentNames =
                user.Departments?.map(dep => dep.department_name).join(', ') || 'N/A';

            // Prepare values for the row
            const values = [
                user.user_id,
                `${user.first_name} ${user.last_name}`,
                user.email,
                user.contact,
                user.position || 'N/A',
                departmentNames,
            ];

            // Draw row borders
            drawRowBorders(y);

            // Draw text for each cell
            x = doc.page.margins.left;
            for (let k = 0; k < values.length; k++) {
                doc.text(values[k], x + 5, y + 7, { width: columnWidths[k] - 10, align: 'left' });
                x += columnWidths[k];
            }
        }

        // Final line after last row
        drawRowBorders(y + rowHeight);

        doc.end();
    } catch (error) {
        console.error('Error exporting hosts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting hosts',
            error: error.message,
        });
    }
};

const getPositionsByUserType = async (req, res) => {
    try {
        // no user_id filter now

        const users = await User.findAll({
            include: [
                {
                    model: UserRoles,
                    as: 'userRoles',
                    where: {
                        user_type_id: 'UTI01' // only filter by user_type_id
                    },
                    required: true
                }
            ]
        });

        const positions = users.map(u => ({
            user_id: u.user_id,
            first_name: u.first_name,
            last_name: u.last_name,
            position: u.position
        }));


        if (!positions.length) {
            return res.status(404).json({ success: false, message: 'No positions found for user_type_id UTI01' });
        }

        res.status(200).json({ success: true, positions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};



const getHosts = async (req, res) => {
    try {
        const hosts = await User.findAll({

            include: [
                {
                    model: UserType,
                    as: 'userTypes', // Must match the alias in association
                    where: { user_type_id: 'UTI01' },
                    attributes: [], // if you don't need UserType data
                    through: { attributes: [] }
                },
                {
                model: Department,
                through: { attributes: [] },
            }],
            order: [['user_id', 'ASC']],
        });

        if (!hosts.length) {
            return res.status(404).json({ success: false, message: 'No hosts found' });
        }

        const data = hosts.map(user => {
            const departments = user.Departments?.map(dep => dep.department_name) || [];
            return {
                ...user.toJSON(),
                departments,
            };
        });

        return res.status(200).json({ success: true, hosts: data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching hosts' });
    }
};




const getUser = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const whereUser = {
            [Op.or]: [
                { user_id: { [Op.like]: `%${search}%` } },
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { position: { [Op.like]: `%${search}%` } },
                { contact: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },

            ]
        };

        const data = await User.findAndCountAll({
            where: whereUser,
            attributes: [
                'user_id',
                'username',
                'password',
                'first_name',
                'last_name',
                'email',
                'contact',
                'position',
            ],
            include: [{
                model: Department,
                through: { attributes: [] },
                attributes: ['department_id', 'department_name'],
                required: false,

            }],
            order: [['user_id', 'ASC']],
            limit,
            offset,
        });

        if (!data || !Array.isArray(data.rows) || data.rows.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'No users found',
            });
        }

        const usersWithDept = data.rows.map(user => {
            const departments = user.Departments?.map(dep => dep.department_name) || [];
            return {
                ...user.toJSON(),
                departments,  // array of department names
            };
        });

        return res.status(200).send({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit),
            totalItems: data.count,
            users: usersWithDept,
        });
    } catch (err) {
        console.log('Error in getUser:', err);
        return res.status(500).send({
            success: false,
            message: 'Error retrieving users',
            error: err.message,
        });
    }
};




// GET VISITOR BY ID
const getUserById = async (req, res) => {
    try {
        const userId = req.params.user_id;
        if (!userId) {
            return res.status(404).send({
                success: false,
                message: 'User ID is required',
            });
        }

        const data = await User.findOne({
            where: { user_id: userId },
            include: [
                {
                    model: Department,
                    through: { attributes: [] },
                },
                {
                    model: UserRoles,
                    as: 'userRoles',
                    attributes: ['user_type_id'],
                    include: [
                        {
                            model: UserType,
                            as: 'userType',
                            attributes: ['user_type_id', 'user_type'],
                        },
                    ],
                },
            ],
        });

        if (!data) {
            return res.status(404).send({
                success: false,
                message: 'User not found',
            });
        }

        // Convert Sequelize instance to plain JSON
        const user = data.toJSON();
        console.log(user);
        // Map departments and roles
        user.department_ids = user.Departments?.map(dep => dep.department_id) || [];

        user.user_type_ids = (user.userRoles || []).map(role => role.user_type_id);
        user.user_types = (user.userRoles || []).map(role => ({
            user_type_id: role.user_type_id,
            user_type_name: role.userType?.user_type || 'N/A',
        }));



        res.status(200).send({
            success: true,
            message: 'User retrieved successfully',
            data: user,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: 'Error getting user by id',
            error: err.message,
        });
    }
};



const generateUserId = async () => {
    const lastUser = await User.findOne({
        order: [['user_id', 'DESC']] // Or use 'visitor_id' if it's ordered correctly
    });

    let newId = 'U001'; // Default for first record

    if (lastUser && lastUser.user_id) {
        // Extract the numeric part of the ID (assuming the format is 'D' + number)
        const numberPart = lastUser.user_id.substring(1);
        const lastIdNumber = parseInt(numberPart, 10);

        if (!isNaN(lastIdNumber)) {
            const nextIdNumber = lastIdNumber + 1;
            newId = `U${nextIdNumber.toString().padStart(3, '0')}`;
        } else {
            // If parsing fails, just reset to default or throw an error
            console.warn(`Warning: Could not parse last department ID number from ${lastUser.user_id}. Resetting to D001.`);
            newId = 'U001';
        }
    }

    return newId;
};

const generatuserIdHandler = async (req, res) => {
    try {
        const newId = await generateUserId();
        res.status(200).send({
            success: true,
            user_id: newId
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: 'Error generating user ID',
            err
        });
    }
};


// CREATE USER
const createUser = async (req, res) => {
    try{
        const { username, password, first_name, last_name, email, contact, position, department_ids,   user_type_ids} = req.body
        if( !username || !password || !first_name || !last_name || !email || !contact ||  !Array.isArray(department_ids) || department_ids.length === 0 || !position || !Array.isArray(user_type_ids) || user_type_ids.length === 0 ){
            return res.status(500).send({
                success: false,
                message: 'All fields are required',
            })
        }

        //  const data = await db.query('INSERT INTO department (department_id, department_name) VALUES (?, ?)',[department_id, department_name])
        const user_id = await generateUserId();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            user_id,
            username, password: hashedPassword, first_name, last_name, email, contact, position,
        });

        await user.setDepartments(department_ids);
        const userRolesPayload = user_type_ids.map(typeId => ({
            user_id: user.user_id,
            user_type_id: typeId,
            department_ids
        }));

        await UserRoles.bulkCreate(userRolesPayload);

        res.status(201).send({
            success: true,
            message: 'User created successfully',
            user_id: user.user_id,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: 'Error creating user',
            err,
        });
    }
};

// UPDATE USER
const updateUser = async (req, res) => {
    try{
        const userId = req.params.user_id;
        if(!userId){
            return res.status(404).send({
                success: false,
                message: 'No such user'
            });
        }
        console.log('updateUser req.body:', req.body);
        const {
            first_name,
            last_name,
            username,
            password,
            contact,
            email,
            position,
            department_ids,
            user_type_ids
        } = req.body;

        if (!contact || contact.trim() === '') {
            return res.status(400).json({ success: false, message: 'Contact is required' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.first_name = first_name ?? user.first_name;
        user.last_name = last_name ?? user.last_name;
        user.username = username ?? user.username;
        user.contact = contact;
        user.email = email ?? user.email;
        user.position = position ?? user.position;

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        // Update department association
        if (Array.isArray(department_ids)) {
            await user.setDepartments(department_ids);
        }


        if (Array.isArray(user_type_ids)) {
            // Remove existing roles
            await UserRoles.destroy({ where: { user_id: userId } });
            // Add new roles
            const roles = user_type_ids.map(roleId => ({
                user_id: userId,
                user_type_id: roleId
            }));
            await UserRoles.bulkCreate(roles);
        }

        res.json({ success: true, message: 'User updated successfully' });

    }catch(err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error updating user',
            err
        })
    }
}


// DELETE USER
const deleteUser = async (req, res) => {
    try{
        const userId = req.params.user_id;
        if(!userId){
            return res.status(400).send({
                success: false,
                message: 'No such user'
            })
        }
        //  await db.query('DELETE FROM department WHERE department_id=?', [departmentId])
        await UserRoles.destroy({
            where: { user_id: userId }
        });


        await User.destroy({
            where: {
                user_id: userId,
            }
        })

        res.status(200).send({
            success: true,
            message: 'User successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error deleting user',
            err
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Find user with roles
        const user = await User.findOne({
            where: { email },
            include: [
                {
                    model: UserRoles,
                    as: 'userRoles',
                    attributes: ['user_type_id'],
                    include: [
                        {
                            model: UserType,
                            as: 'userType',
                            attributes: ['user_type_id', 'user_type']
                        }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Map roles
        const roles = (user.userRoles || []).map(role => ({
            user_type_id: role.user_type_id,
            user_type_name: role.userType?.user_type.toLowerCase() || 'N/A'
        }));

        // Prepare user data
        const userData = {
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            position: user.position,
            roles
        };

        // Generate JWT token
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, roles },
            process.env.JWT_SECRET, // make sure you have this in your .env
            { expiresIn: '1h' }
        );

        return res.json({ success: true, user: userData, token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


module.exports = {exportAllHosts, getUser, getUserById, createUser, updateUser, deleteUser, loginUser, generateUserId, generatuserIdHandler, getHosts , getPositionsByUserType };