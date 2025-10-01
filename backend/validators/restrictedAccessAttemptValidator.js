const { body } = require('express-validator');

const restrictedAccessAttemptValidationRules = () => [
    body('attempt_id')
        .isString().withMessage('attempt_id must be a string')
        .notEmpty().withMessage('attempt_id is required'),

    body('timestamp')
        .isISO8601().toDate().withMessage('timestamp must be a valid date')
        .notEmpty().withMessage('timestamp is required'),

    body('access_point')
        .isISO8601().toDate().withMessage('access_point must be a valid date')
        .notEmpty().withMessage('access_point is required'),

    body('status')
        .isString().withMessage('status must be a string')
        .notEmpty().withMessage('status is required')

];

module.exports = restrictedAccessAttemptValidationRules;
