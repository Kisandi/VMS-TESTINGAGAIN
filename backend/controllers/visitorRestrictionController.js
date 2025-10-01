const db = require("../config/db");
const { VisitorRestriction, Department} = require('../models');

const getVisitorRestriction = async (req, res) => {
    try {
      //  const data = await db.query(`SELECT * FROM visitorrestriction`);

        const page = parseInt(req.query.page) || 1; // default page = 1
        const limit = parseInt(req.query.limit) || 2; // default limit = 2
        const offset = (page - 1) * limit;

        const data = await VisitorRestriction.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['visitor_id', 'ASC']],
        });

         if (!data || data.rows.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'No visitor restrictions found.'
            });
        }
        res.status(200).send({
            success: true,
            message: 'Visitor restriction successfully',
            totalRecords: data.count,
            data: data.rows
        })
    }catch(err) {
        console.log(err)
        res.status(500).send({
            success: false,
            message: 'Error getting visitor restriction failed',
            err
        })
    }
};




// CREATE DEPARTMENT
const createVisitorRestriction = async (req, res) => {
    try {
        const { visitor_id, token_id, restricted_attempt_id } = req.body;

        if (!visitor_id || !token_id || !restricted_attempt_id) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        const restriction = await VisitorRestriction.create({
            visitor_id,
            token_id,
            restricted_attempt_id,
        });

        res.status(201).json({
            success: true,
            message: 'Visitor restriction created successfully',
            data: restriction,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error creating visitor restriction',
            error: err.message,
        });
    }
};



module.exports = {getVisitorRestriction, createVisitorRestriction  };