const { body } = require('express-validator');

const appointmentValidationRules = () => [
    body('appointment_id')
        .isString().withMessage('appointment_id must be a string')
        .notEmpty().withMessage('appointment_id is required'),

    body('created_at')
        .isISO8601().toDate().withMessage('created_at must be a valid date')
        .notEmpty().withMessage('created_at is required'),

    body('requested_date_time')
        .isISO8601().toDate().withMessage('requested_date_time must be a valid date')
        .notEmpty().withMessage('Requested Date and Time is required'),

    body('purpose')
        .isString().withMessage('purpose must be a string')
        .notEmpty().withMessage('purpose is required')
        .isLength({ min: 3 }).withMessage('Purpose must be at least 3 characters long'),

    body('duration')
        .isString().withMessage('duration must be a string')
        .notEmpty().withMessage('duration is required'),

    body('approval_status')
        .isIn(['pending', 'approved', 'declined']) // adjust based on your app logic
        .withMessage('approval_status must be one of: pending, approved, declined'),

    // body('department_id')
    //     .isString().withMessage('department_id must be a string')
    //     .notEmpty().withMessage('department_id is required'),
    //
    // body('visitor_id')
    //     .isString().withMessage('visitor_id must be a string')
    //     .notEmpty().withMessage('visitor_id is required'),
    //
    // body('token_id')
    //     .isString().withMessage('token_id must be a string')
    //     .notEmpty().withMessage('token_id is required'),
    //
    // body('user_id')
    //     .isString().withMessage('user_id must be a string')
    //     .notEmpty().withMessage('user_id is required'),
];

module.exports = appointmentValidationRules;
