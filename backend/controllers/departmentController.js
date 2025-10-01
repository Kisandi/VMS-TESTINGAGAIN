const { Department, Visitor, User, sequelize, UserDepartment} = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');

const exportAllDepartments = async (req, res) => {
    try {
        const departments = await Department.findAll({
            order: [['department_id', 'ASC']],
        });

        if (!departments || departments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No departments found',
            });
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Disposition', 'attachment; filename=departments.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        doc.fontSize(18).text('All Departments', { align: 'center' });
        doc.moveDown();

        departments.forEach((dept, index) => {
            doc.fontSize(12).text(`${index + 1}. ID: ${dept.department_id} - Name: ${dept.department_name}`);
        });

        doc.end();
    } catch (error) {
        console.error('Error exporting departments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting departments',
            error: error.message,
        });
    }
};

const getDepartment = async (req, res) => {
    try {


        const page = parseInt(req.query.page) || 1; // default page = 1
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const search = req.query.search || '';

        const whereClause = search
            ? {
                [Op.or]: [
                    { department_name: { [Op.like]: `%${search}%` } },
                    { department_id: { [Op.like]: `%${search}%` } }
                ]
            }
            : {};

        const data = await Department.findAndCountAll({
            where: whereClause,
            offset: offset,
            limit: limit,
            order: [['department_id', 'ASC']],
        });

        // res.json({
        //     success: true,
        //     currentPage: page,
        //     totalPages: Math.ceil(data.count / limit),
        //     totalRecords: data.count,
        //     departments: data.rows,
        // });

        if (!data || !Array.isArray(data.rows) || data.rows.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such department'
            })
        }
        return res.status(200).json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit),
            totalRecords: data.count,
            departments: data.rows,
        })
    }catch(err) {
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting Department',
            err
        })
    }
};


// GET VISITOR BY ID
const getDepartmentById = async (req, res) => {
    try {
        const departmentId = req.params.department_id;
        // console.log("Visitor ID from params:", visitorId);
        if (!departmentId){
            return res.status(404).send({
                success: false,
                message: 'No such department'
            });
        }

        // const data = await db.query(' SELECT * FROM visitor WHERE id ='+visitorId)

       // const data = await db.query('SELECT * FROM department WHERE department_id=?', [departmentid]);
      const data = await Department.findOne({
            where: {department_id: departmentId}
        });

        console.log("Query result:", data);
        if (!data || data.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such department'
            });
        }
        res.status(200).send({
            success: true,
            message: 'Department successfully',
            data: data,
        });
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting department by id',
        });
    }
};

const getUsersForDepartment = async (req, res) => {
    const { department_id } = req.params;

    if (!department_id) {
        return res.status(400).json({ success: false, message: 'department_id is required' });
    }

    try {
        const users = await User.findAll({
            include: [
                {
                    model: Department,
                    where: { department_id },
                    through: { attributes: [] } // hides join table fields
                }
            ],
            attributes: ['user_id', 'first_name', 'last_name', 'email'],
        });

        res.json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};


const generateDepartmentId = async () => {
    const lastDepartment = await Department.findOne({
        order: [['department_id', 'DESC']] // Or use 'visitor_id' if it's ordered correctly
    });

    let newId = 'D001'; // Default for first record

    if (lastDepartment && lastDepartment.department_id) {
        // Extract the numeric part of the ID (assuming the format is 'D' + number)
        const numberPart = lastDepartment.department_id.substring(1);
        const lastIdNumber = parseInt(numberPart, 10);

        if (!isNaN(lastIdNumber)) {
            const nextIdNumber = lastIdNumber + 1;
            newId = `D${nextIdNumber.toString().padStart(3, '0')}`;
        } else {
            // If parsing fails, just reset to default or throw an error
            console.warn(`Warning: Could not parse last department ID number from ${lastDepartment.department_id}. Resetting to D001.`);
            newId = 'D001';
        }
    }

    return newId;
};

const generateDepartmentIdHandler = async (req, res) => {
    try {
        const newId = await generateDepartmentId();
        res.status(200).send({
            success: true,
            department_id: newId
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: 'Error generating department ID',
            err
        });
    }
};

// CREATE DEPARTMENT
const createDepartment = async (req, res) => {
    try{
        const { department_name} = req.body;
        console.log("Received:", req.body);
        if( !department_name){
            return res.status(500).send({
                success: false,
                message: 'All fields are required',
                missingFields: {

                    department_name: !!department_name,
                }
            })
        }
        const department_id = await generateDepartmentId();
      //  const data = await db.query('INSERT INTO department (department_id, department_name) VALUES (?, ?)',[department_id, department_name])

        const data = await Department.create({
            department_id,
            department_name,
        })

        if (!data){
            return res.status(400).send({
                success: false,
                message: 'Error creating department',
            })
        }
        res.status(201).send({
            success: true,
            message: 'Department successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error creating department',
            err
        })
    }
}

// UPDATE DEPARTMENT
const updateDepartment = async (req, res) => {
    try{
        const departmentId = req.params.department_id;
        if(departmentId[0] === 0){
            return res.status(404).send({
                success: false,
                message: 'No such department'
            })
        }
        const {department_name} = req.body
      //  const data = await db.query('UPDATE department SET department_name = ? WHERE department_id = ?', [department_name, departmentId])
        const data = await Department.update(
            {department_name},
            {
                where: {
                    department_id: departmentId,
                }
            }
        )
        if (!data){
            return res.status(500).send({
                success: false,
                message: 'Error updating department',
            })
        }
        res.status(200).send({
            success: true,
            message: 'Department successfully',
        })
    }catch(err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error updating department',
            err
        })
    }
}


// DELETE DEPARTMENT
const deleteDepartment = async (req, res) => {
    const t = await sequelize.transaction();
    try{
        const departmentId = req.params.department_id;

        if(!departmentId){
            return res.status(400).send({
                success: false,
                message: 'No such department'
            })
        }

        // Check if department exists
        const department = await Department.findByPk(departmentId, { transaction: t });
        if (!department) {
            await t.rollback();
            return res.status(404).send({
                success: false,
                message: 'Department not found.'
            });
        }

        // Delete dependent rows in user_department
        await UserDepartment.destroy({
            where: { department_id: departmentId },
            transaction: t
        });

        //  await db.query('DELETE FROM department WHERE department_id=?', [departmentId])
        await Department.destroy({
            where: { department_id: departmentId },
            transaction: t
        });
        await t.commit();

        res.status(200).send({
            success: true,
            message: 'Department Deleted successfully',
        })
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).send({
            success: false,
            message: 'Error deleting department.',
            error: err.message
        });
    }
}

module.exports = {exportAllDepartments, getDepartment, getDepartmentById, createDepartment, updateDepartment, deleteDepartment  , generateDepartmentIdHandler, generateDepartmentId, getUsersForDepartment};