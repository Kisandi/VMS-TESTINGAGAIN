const db = require("../config/db");
const {RestrictedAccessAttempt, Department, CheckinCheckout} = require("../models");

const getRestrictedAttempts = async (req, res) => {
    try {
      //  const data = await db.query(`SELECT * FROM restricted_access_attempt`);

        const page = parseInt(req.query.page) || 1; // default page = 1
        const limit = parseInt(req.query.limit) || 100; // default limit = 2
        const offset = (page - 1) * limit;

        const data = await RestrictedAccessAttempt.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['attempt_id', 'ASC']],
        });


        if (!data || data.rows.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such attempt',
            })
        }
        res.status(200).send({
            success: true,
            message: 'Restricted access attempts fetched successfully',
            totalAttempts: data.count,
            attempts: data.rows,
            currentPage: page,
            totalPages: Math.ceil(data.count / limit)
        })
    }catch(err) {
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting Attempt',
            err
        })
    }
};


// GET VISITOR BY ID
const getAttemptById = async (req, res) => {
    try {
        const attemptId = req.params.attempt_id;
        // console.log("Visitor ID from params:", visitorId);
        if (!attemptId){
            return res.status(404).send({
                success: false,
                message: 'No such attempt',
            });
        }

        // const data = await db.query(' SELECT * FROM visitor WHERE id ='+visitorId)

     //   const data = await db.query('SELECT * FROM restricted_access_attempt WHERE attempt_id=?', [attemptid]);

        const data = await RestrictedAccessAttempt.findAll({
            where: {attempt_id: attemptId}
        });

        console.log("Query result:", data);
        if (!data || data.length === 0){
            return res.status(404).send({
                success: false,
                message: 'No such attempt',
            });
        }
        res.status(200).send({
            success: true,
            message: 'attempt successfully',
            data: data[0],
        });
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting attempt by id',
        });
    }
};

// CREATE DEPARTMENT
const createAttempt = async (req, res) => {
    try{
        const {attempt_id, timestamp, access_point, status} = req.body
        if(!attempt_id || !timestamp || !access_point || !access_point || !status){
            return res.status(500).send({
                success: false,
                message: 'All fields are required to create an access attempt',
            })
        }

    //    const data = await db.query('INSERT INTO restricted_access_attempt (attempt_id, timestamp, access_point, status) VALUES (?, ?, ?, ?)',[attempt_id, timestamp, access_point, status])

        const data = await RestrictedAccessAttempt.create({
            attempt_id,
            timestamp,
            access_point,
            status,
        })

        if (!data){
            return res.status(400).send({
                success: false,
                message: 'Error creating attempt',
            })
        }
        res.status(201).send({
            success: true,
            message: 'Attempt successfully',
        })
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error creating attempt',
            err
        })
    }
}



module.exports = {getRestrictedAttempts, getAttemptById, createAttempt};