const { body } = require('express-validator');

const appointmentValidationRules = () => [
    body('location_id')
        .isString().withMessage('location_id must be a string')
        .notEmpty().withMessage('location_id is required'),

    body('location')
        .isISO8601().toDate().withMessage('location must be a valid date')
        .notEmpty().withMessage('location is required'),
];

module.exports = appointmentValidationRules;
