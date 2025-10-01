const { body } = require('express-validator');

const appointmentValidationRules = () => [
    body('department_id')
        .isString().withMessage('department_id must be a string')
        .notEmpty().withMessage('department_id is required'),

    body('department_name')
        .isISO8601().toDate().withMessage('department_name must be a valid date')
        .notEmpty().withMessage('department_name is required'),

];

module.exports = appointmentValidationRules;
