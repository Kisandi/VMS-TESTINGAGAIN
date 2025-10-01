const { body } = require('express-validator');

const permissionHasUserValidationRules = () => [
    // body('permission')
    //     .isString().withMessage('appointment_id must be a string')
    //     .notEmpty().withMessage('appointment_id is required'),
    //
    // body('created_at')
    //     .isISO8601().toDate().withMessage('created_at must be a valid date')
    //     .notEmpty().withMessage('created_at is required'),
    //
    // body('requested_date_time')
    //     .isISO8601().toDate().withMessage('requested_date_time must be a valid date')
    //     .notEmpty().withMessage('Requested Date and Time is required'),
    //
    // body('purpose')
    //     .isString().withMessage('purpose must be a string')
    //     .notEmpty().withMessage('purpose is required')
    //     .isLength({ min: 3 }).withMessage('Purpose must be at least 3 characters long'),


];

module.exports = permissionHasUserValidationRules;
