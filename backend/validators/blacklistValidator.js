const { body } = require('express-validator');

const blacklistValidationRules = () => [
    body('blacklist_id')
        .isString().withMessage('blacklist_id must be a string')
        .notEmpty().withMessage('blacklist_id is required'),

    body('blocked_at')
        .isISO8601().toDate().withMessage('blocked_at must be a valid date')
        .notEmpty().withMessage('blocked_at is required'),

    body('blocked_by_user_id')
        .isInt().withMessage('blocked_by_user_id must be a string')
        .notEmpty().withMessage('blocked_by_user_id is required'),

    body('reason')
        .isString().withMessage('reason must be a string')
        .notEmpty().withMessage('reason is required')
        .isLength({ min: 3 }).withMessage('reason must be at least 3 characters long'),


];

module.exports = blacklistValidationRules;
