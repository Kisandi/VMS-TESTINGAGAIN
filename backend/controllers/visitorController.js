const { Visitor,
    CheckinCheckout,
    Appointment
} = require('../models');
const { Op } = require('sequelize'); 
// Check if email exists
const checkEmailExists = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const visitor = await Visitor.findOne({ where: { email } });

        res.status(200).json({ exists: !!visitor, visitor_id: visitor?.visitor_id || null });
    } catch (err) {
        console.error('Error checking email uniqueness:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Check if ID number (nic) exists
const checkIdNumberExists = async (req, res) => {
    try {
        const { idNumber } = req.query;
        if (!idNumber) {
            return res.status(400).json({ success: false, message: 'ID number is required' });
        }

        const visitor = await Visitor.findOne({ where: { nic: idNumber } });

        res.status(200).json({ exists: !!visitor });
    } catch (err) {
        console.error('Error checking ID number uniqueness:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getVisitor = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const data = await Visitor.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['visitor_id', 'ASC']],
        });

        res.json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit),
            totalRecords: data.count,
            visitors: data.rows,
        });

        if (!data || data.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such visitor'
            })
        }
    }catch(err) {
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting visitor',
            err
        })
    }
};

// GET VISITOR BY ID
const getVisitorById = async (req, res) => {
    try {
        const visitorId = req.params.visitor_id;
        // console.log("Visitor ID from params:", visitorId);
        if (!visitorId){
            return res.status(404).send({
                success: false,
                message: 'No such visitor'
            });
        }

        const data = await Visitor.findAll({
            where: {visitor_id: visitorId}
        });


        console.log("Query result:", data);
        if (!data || data.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such visitor'
            });
        }
        res.status(200).send({
            success: true,
            message: 'Visitor successfully',
            visitor: data[0],
        });
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting visitor by id',
        });
    }
};

const getBlacklistedVisitors = async (req, res) => {
    try {
        const blacklisted = await Visitor.findAll({
            where: {
                blacklist_status: 'yes',
            },
            order: [['visitor_id', 'ASC']],
        });

        if (!blacklisted || blacklisted.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No blacklisted visitors found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Blacklisted visitors retrieved successfully',
            visitors: blacklisted,
        });
    } catch (err) {
        console.error('Error fetching blacklisted visitors:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching blacklisted visitors',
            err,
        });
    }
};

const toggleBlacklistStatus = async (req, res) => {
    try {
        const visitorId = req.params.visitor_id;
        const { blacklist_status } = req.body;

        if (!visitorId || !['yes', 'no'].includes(blacklist_status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid visitor_id or blacklist_status',
            });
        }

        const visitor = await Visitor.findOne({ where: { visitor_id: visitorId } });

        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: 'Visitor not found',
            });
        }

        visitor.blacklist_status = blacklist_status;
        await visitor.save();

        res.status(200).json({
            success: true,
            message: `Blacklist status updated to ${blacklist_status}`,
        });
    } catch (err) {
        console.error('Error updating blacklist status:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while updating blacklist status',
        });
    }
};



const generateVisitorId = async () => {
    const lastVisitor = await Visitor.findOne({
        order: [['visitor_id', 'DESC']] // Or use 'visitor_id' if it's ordered correctly
    });

    let newId = 'V001'; // Default for first record

    if (lastVisitor && lastVisitor.visitor_id) {
        // Extract number and increment
        const lastIdNumber = parseInt(lastVisitor.visitor_id.substring(1)); // Remove 'V'
        const nextIdNumber = lastIdNumber + 1;

        // Pad with leading zeros (e.g., 5 => 'V005')
        newId = `V${nextIdNumber.toString().padStart(3, '0')}`;

    }

    return newId;
};

const generateVisitorIdHandler = async (req, res) => {
    try {
        const newId = await generateVisitorId();
        res.status(200).send({
            success: true,
            visitor_id: newId
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: 'Error generating visitor ID',
            err
        });
    }
};

const getPastVisits = async (req, res) => {
    try {
        const visitorId = req.query.visitor_id;

        const pastVisits = await CheckinCheckout.findAll({
            where: {
                checkout_time: { [Op.not]: null },
            },
            include: [
                {
                    model: Appointment,
                    as: "appointment",
                    where: {
                        approval_status: 'approved',
                        visitor_id: visitorId, // ✅ Only fetch relevant past visits
                    },
                },
            ],
            order: [['checkout_time', 'DESC']],
        });


        res.json(pastVisits);
    } catch (error) {
        console.error('Error fetching past visits:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// CREATE VISITOR
const createVisitor = async (req, res) => {
    try{
        const {visitor_id, first_name, last_name, id_type, nic, registered_date, email, contact_number, blacklist_status, address, date_of_birth, file }= req.body
        if(!visitor_id || !first_name || !last_name || !id_type || !nic || !registered_date || !email || !contact_number || !blacklist_status || !address || !date_of_birth || !file){
            return res.status(500).send({
                success: false,
                message: 'Error creating visitor/para',
                missingFields: {
                    visitor_id: !!visitor_id,
                    first_name: !!first_name,
                    last_name: !!last_name,
                    id_type: !!id_type,
                    nic: !!nic,
                    registered_date: !!registered_date,
                    email: !!email,
                    contact_number: !!contact_number,
                    blacklist_status: !!blacklist_status,
                    address: !!address,
                    date_of_birth: !!date_of_birth,
                    file: !!file,
                }
            })
        }

        //    const data = await db.query('INSERT INTO visitor (visitor_id, first_name, last_name, id_type, nic, registered_date, email, contact_number, blacklist_status, token_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[visitor_id, first_name, last_name, id_type, nic, registered_date, email, contact_number, blacklist_status, token_id, user_id])

        const data = await Visitor.create({
            visitor_id,
            first_name,
            last_name,
            id_type,
            nic,
            registered_date,
            email,
            contact_number,
            blacklist_status,
            address,
            date_of_birth,
            file,
        })

        if (!data){
            return res.status(400).send({
                success: false,
                message: 'Error creating visitor'
            })
        }
        res.status(201).send({
            success: true,
            message: 'Visitor successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error creating visitor',
            err
        })
    }
}

// UPDATE VISITOR
const updateVisitor = async (req, res) => {
    try{
        const visitorId = req.params.visitor_id;
        if(!visitorId){
            return res.status(404).send({
                success: false,
                message: 'No such visitor'
            })
        }
        const {visitor_id, first_name, last_name, id_type, nic, registered_date, email, contact_number, blacklist_status} = req.body
        //   const data = await db.query('UPDATE visitor SET first_name = ?, last_name = ?, id_type = ?, nic = ?, registered_date = ?, email = ?, contact_number = ?, blacklist_status = ?, token_id = ?, user_id = ? WHERE visitor_id = ?', [first_name, last_name, id_type, nic, registered_date, email, contact_number, blacklist_status, token_id, user_id, visitor_id])

        const data = await Visitor.update(
            {first_name, last_name, id_type, nic, registered_date, email, contact_number, blacklist_status},
            {
                where: {
                    visitor_id: visitorId,
                }
            }
        )

        if (!data){
            return res.status(500).send({
                success: false,
                message: 'Error updating visitor',
            })
        }
        res.status(200).send({
            success: true,
            message: 'Visitor updated successfully',
        })
    }catch(err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error updating visitor',
            err
        })
    }
}

// DELETE VISITOR
const deleteVisitor = async (req, res) => {
    try{
        const visitorId = req.params.visitor_id;
        if(!visitorId){
            return res.status(400).send({
                success: false,
                message: 'No such visitor'
            })
        }
        // await db.query('DELETE FROM visitor WHERE visitor_id=?', [visitorId])

        await Visitor.destroy({
            where: {
                visitor_id: visitorId,
            }
        })


        res.status(200).send({
            success: true,
            message: 'Visitor successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error deleting visitor',
            err
        })
    }
}

module.exports = {getVisitor, getVisitorById, createVisitor, updateVisitor, deleteVisitor, generateVisitorId, generateVisitorIdHandler, getPastVisits, checkEmailExists, checkIdNumberExists, getBlacklistedVisitors, toggleBlacklistStatus};