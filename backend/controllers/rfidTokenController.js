const db = require("../config/db");
const { CheckinCheckout, RFIDToken, Appointment, Visitor, User, Location} = require("../models");
const { v4: uuidv4 } = require("uuid");

const getRfid = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const offset = (page - 1) * limit;

        const data = await RFIDToken.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['token_id', 'ASC']],
        });

        if (!data || !Array.isArray(data.rows) || data.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No RFID tokens found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'RFID tokens retrieved successfully',
            totalRecords: data.count,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit),
            data: data.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error retrieving RFID tokens',
            error: err.message,
        });
    }
};



// GET RFID TOKEN BY ID
const getRfidById = async (req, res) => {
    try {
        const tokenId = req.params.token_id;
        // console.log("Visitor ID from params:", visitorId);
        if (!tokenId){
            return res.status(404).send({
                success: false,
                message: 'No such RFID token found'
            });
        }

        // const data = await db.query(' SELECT * FROM visitor WHERE id ='+visitorId)

      //  const data = await db.query('SELECT * FROM rfid_token WHERE token_id=?', [tokenid]);

        const data = await RFIDToken.findAll({
            where: {token_id: tokenId}
        });


        console.log("Query result:", data);
        if (!data || data.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such rfid token found'
            });
        }
        res.status(200).send({
            success: true,
            message: 'RFID successfully',
            data: data[0],
        });
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting RFID by id',
        });
    }
};

async function generateNextTokenId() {
    const tokens = await RFIDToken.findAll({
        attributes: ['token_id'],
        order: [['token_id', 'ASC']]
    });

    const tokenSet = new Set(tokens.map(t => parseInt(t.token_id.slice(1), 10)));

    let i = 1;
    while (true) {
        if (!tokenSet.has(i)) {
            return `T${i.toString().padStart(3, '0')}`;
        }
        i++;
    }
}



// CREATE DEPARTMENT
const createRfid = async (req, res) => {
    try{
        console.log("Incoming RFID POST body:", req.body);

        const {appointment_id, visitor_id, user_id} = req.body
        if(!appointment_id || !visitor_id || !user_id){
            return res.status(400).send({
                success: false,
                message: 'Missing required fields: appointment_id, visitor_id, or user_id',
            })
        }

        const appt = await Appointment.findOne({
            where: { appointment_id },
            attributes: ['appointment_id', 'location_id', 'requested_date_time', 'user_id', 'visitor_id', 'purpose'],
        });
        if (!appt) {
            return res.status(404).send({ success: false, message: 'Appointment not found' });
        }
        if (!appt.location_id) {
            return res.status(400).send({ success: false, message: 'Appointment has no location_id' });
        }

        const loc = await Location.findByPk(appt.location_id, { attributes: ['location'] });
        const meeting_point = loc?.location || 'Reception';



        const existingToken = await RFIDToken.findOne({ where: { appointment_id } });
        if (existingToken) {
            return res.status(400).send({
                success: false,
                message: "Token already issued for this appointment",
            });
        }
     //   const data = await db.query('INSERT INTO department (department_id, department_name) VALUES (?, ?)',[department_id, department_name])

        const token_id = await generateNextTokenId();
        const issued_at = new Date();
        const expired_at = new Date(issued_at.getTime() + 24 * 60 * 60 * 1000);

        const newToken = await RFIDToken.create({
            token_id,
            issued_at,
            expired_at,
            status: "active",
            visitor_id,
            user_id,
            appointment_id,
            meeting_point,
        })

        await Appointment.update(
            { token_id },
            {
                where: { appointment_id },
            }
        );
        const checkinId = uuidv4(); // or use auto-increment from DB
        await CheckinCheckout.create({
            checkin_id: checkinId,
            checkin_time: new Date(),
            checkout_time: null,
            token_id: token_id,
            visitor_id: visitor_id,
            appointment_id
        });
        res.status(201).send({
            success: true,
            message: "RFID token created and appointment updated",
            token: newToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            message: "Error creating RFID token",
            err,
        });
    }
};


// UPDATE DEPARTMENT
const updateRfid = async (req, res) => {
    try{
        const rfidId = req.params.token_id;
        if(!rfidId){
            return res.status(404).send({
                success: false,
                message: 'No such Rfid'
            })
        }
        const {issued_at, expired_at, status} = req.body
       // const data = await db.query('UPDATE rfid_token SET issued_at = ?, expired_at = ?, status = ?, attempt_id = ?, visitor_id = ?, user_id = ? WHERE token_id = ?', [issued_at, expired_at, status, attempt_id, visitor_id, user_id, rfidId])

        const data = await RFIDToken.update(
            {issued_at, expired_at, status},
            {
                where: {
                    token_id: rfidId,
                }
            }
        )


        if (!data){
            return res.status(500).send({
                success: false,
                message: 'Error updating rfid',
            })
        }
        res.status(200).send({
            success: true,
            message: 'Rfid successfully',
        })
    }catch(err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error updating rfid',
            err
        })
    }
}


// DELETE DEPARTMENT
const deleteRfid = async (req, res) => {
    try{
        const rfidId = req.params.token_id;
        if(!rfidId){
            return res.status(400).send({
                success: false,
                message: 'No such department'
            })
        }
      //  await db.query('DELETE FROM rfid_token WHERE token_id=?', [rfidId])

        await RFIDToken.destroy({
            where: {
                token_id: rfidId,
            }
        })


        res.status(200).send({
            success: true,
            message: 'Rfid successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error deleting Rfid',
            err
        })
    }
}



module.exports = {getRfid, getRfidById, createRfid, updateRfid, deleteRfid};