const dayjs = require('dayjs');
const { Op } = require("sequelize");
const { sequelize } = require('../models');

const { v4: uuidv4 } = require('uuid');
const {
    RFIDToken,
    Visitor,
    Location,
    Permission,
    PermissionHasUser,
    RestrictedAccessAttempt,
    VisitorRestriction,
    User,
    Department,
    Appointment
} = require('../models');

const accessLocation = async (req, res) => {
  try {
    const { rfid, location_id } = req.body;
    if (!rfid || !location_id) {
      return res.status(400).json({ success: false, message: "rfid and location_id required" });
    }

    // 1. Check RFID token
    const token = await RFIDToken.findOne({ where: { token_id: rfid } });
    if (!token) return res.status(404).json({ success: false, message: "RFID not recognized" });

    // 2. Check location
    const location = await Location.findOne({ where: { location_id } });
    if (!location) return res.status(404).json({ success: false, message: "Location not found" });

    // 3. Public location → grant access
    if (Number(location.is_public) === 1) {
      return res.status(200).json({ success: true, message: "Access granted (public location)" });
    }

    // 4. Restricted location → check approved appointment for this visitor and location
    const appointment = await Appointment.findOne({
      where: {
        location_id,
        visitor_id: token.visitor_id,
        approval_status: 'approved'
      }
    });

    if (appointment) {
      return res.status(200).json({ success: true, message: "Access granted (appointment valid)" });
    }

    // 5. Denied access → log attempt
    const attempt_id = uuidv4();
    const timestamp = new Date();

    await RestrictedAccessAttempt.create({
      attempt_id,
      timestamp,
      access_point: location.location,
      status: "denied",
    });

    await VisitorRestriction.create({
      token_id: rfid,
      restricted_attempt_id: attempt_id,
      visitor_id: token.visitor_id,
    });

    return res.status(403).json({ success: false, message: "Access denied and logged" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const getAvailableLocations = async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ success: false, message: "user_id is required" });
    }

    try {
        const locations = await Location.findAll({
            attributes: ['location_id', 'location', 'is_public'],
            where: {
                [Op.or]: [
                    { is_public: true },
                    {
                        location_id: {
                            [Op.in]: sequelize.literal(`(
                                SELECT location_id
                                FROM permission_has_user
                                WHERE user_id = ${sequelize.escape(user_id)}
                            )`)
                        }
                    }
                ]
            },
            order: [['location_id', 'ASC']]
        });

        res.json({ success: true, locations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching locations', error: err.message });
    }
};




const getLocation = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const data = await Location.findAndCountAll({
            attributes: ['location_id','location', 'is_public'],
            offset,
            limit,
            order: [['location_id', 'ASC']],
        });

        res.json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit),
            totalRecords: data.count,
            locations: data.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error getting locations',
            error: err.message || err,
        });
    }
};



// GET VISITOR BY ID
const getLocationById = async (req, res) => {
    try {
        const locationId = req.params.location_id;
        // console.log("Visitor ID from params:", visitorId);
        if (!locationId){
            return res.status(404).send({
                success: false,
                message: 'No such location',
            });
        }

        // const data = await db.query(' SELECT * FROM visitor WHERE id ='+visitorId)

        // const data = await db.query('SELECT * FROM department WHERE department_id=?', [departmentid]);
        const data = await Location.findAll({
            where: {location_id: locationId}
        });

        console.log("Query result:", data);
        if (!data || data.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such location found.',
            });
        }
        res.status(200).send({
            success: true,
            message: 'Location successfully',
            data: data[0],
        });
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting department by id',
        });
    }
};



const generateLocationId = async () => {
    const lastLocation = await Location.findOne({
        where: {
            location_id: { [Op.like]: 'LT%' }
        },
        order: [
            [sequelize.literal("CAST(SUBSTRING(location_id, 3) AS UNSIGNED)"), "DESC"]
        ]
    });

    let nextNumber = 1;

    if (lastLocation && lastLocation.location_id) {
        const match = lastLocation.location_id.match(/^LT(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    return `LT${String(nextNumber).padStart(3, '0')}`;
};

// CREATE DEPARTMENT
const createLocation = async (req, res) => {
    try{
        const {location, is_public} = req.body
        if(!location){
            return res.status(500).send({
                success: false,
                message: 'All fields are required',
            })
        }

        //  const data = await db.query('INSERT INTO department (department_id, department_name) VALUES (?, ?)',[department_id, department_name])
        const location_id = await generateLocationId();

        // if (!is_public && department_name) {
        //     const dept = await Department.findOne({ where: { department_name } });
        //     if (!dept) {
        //         return res.status(400).send({
        //             success: false,
        //             message: "Invalid department name",
        //         });
        //     }
        //     department_id = dept.department_id;
        // }

        const data = await Location.create({
            location_id,
            location,

            is_public,
        })

        if (!data){
            return res.status(400).send({
                success: false,
                message: 'Error creating location',
            })
        }
        res.status(201).send({
            success: true,
            message: 'Location successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error creating location',
            err
        })
    }
}

// UPDATE location
const updateLocation = async (req, res) => {
    try{
        const locationId = req.params.location_id;
        if(!locationId){
            return res.status(404).send({
                success: false,
                message: 'No such location',
            })
        }
        const {location, is_public} = req.body
        //  const data = await db.query('UPDATE department SET department_name = ? WHERE department_id = ?', [department_name, departmentId])
        const data = await Location.update(
            {location, is_public},
            {
                where: {
                    location_id: locationId,
                }
            }
        )
        if(data[0] === 0){
            return res.status(500).send({
                success: false,
                message: 'Error updating location',
            })
        }
        res.status(200).send({
            success: true,
            message: 'Location successfully',
        })
    }catch(err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error updating location',
            err
        })
    }
}


// DELERTMENT
const deleteLocation = async (req, res) => {
    try{
        const locationId = req.params.location_id;
        if(!locationId){
            return res.status(400).send({
                success: false,
                message: 'No such location',
            })
        }
        //  await db.query('DELETE FROM department WHERE department_id=?', [departmentId])
        await Location.destroy({
            where: {
                location_id: locationId,
            }
        })

        res.status(200).send({
            success: true,
            message: 'Location successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error deleting location',
            err
        })
    }
}

module.exports = {getLocation, getLocationById, createLocation, updateLocation, deleteLocation, accessLocation, getAvailableLocations };