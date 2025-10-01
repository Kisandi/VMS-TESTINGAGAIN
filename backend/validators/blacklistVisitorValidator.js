const { body } = require('express-validator');

const blacklistVisitorValidationRules = () => [
    body('blacklist_id')
        .isString().withMessage('blacklist_id must be a string')
        .notEmpty().withMessage('blacklist_id is required'),

    body('visitor_id')
        .isISO8601().toDate().withMessage('visitor_id must be a valid date')
        .notEmpty().withMessage('visitor_id is required'),


];

module.exports = blacklistVisitorValidationRules;
