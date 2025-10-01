const { body } = require('express-validator');

const checkInOutValidationRules = () => [
    body('checkin_id')
        .isString().withMessage('checkin_id must be a string')
        .notEmpty().withMessage('checkin_id is required'),

    body('checkin_time')
        .isISO8601().toDate().withMessage('checkin_time must be a valid date')
        .notEmpty().withMessage('checkin_time is required'),

    body('checkout_time')
        .isISO8601().toDate().withMessage('checkout_time must be a valid date')
        .notEmpty().withMessage('checkout_time is required'),


];

module.exports = checkInOutValidationRules;
